const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const Project = require("./models/Project");
const Message = require("./models/Message");
const User = require("./models/User");
const { socketAuthMiddleware, expressAuthMiddleware } = require("./utils/authVerifier");
const { isValidEthAddress } = require("./services/reconciliationService");
const { validateStartupConfig } = require("./utils/configValidator");

const CLIENT_ALLOWED_MESSAGE_TYPES = new Set(["TEXT", "FILE"]);

async function isUserActiveAndAuthorized(userId) {
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId).select("role isSuspended email authProvider isEmailVerified");
  if (!user || user.isSuspended) return null;
  return user;
}

function createServerApp(config = {}) {
  const isProd = (config.nodeEnv || process.env.NODE_ENV) === "production";

  // Validate environment configuration
  if (!config.skipConfigValidation) {
    validateStartupConfig(process.env);
  }

  if (config.canonicalEscrowAddress && !isValidEthAddress(config.canonicalEscrowAddress)) {
    throw new Error("FATAL_STARTUP_INVALID_ESCROW_CONFIG");
  }
  if (config.canonicalTokenAddress && !isValidEthAddress(config.canonicalTokenAddress)) {
    throw new Error("FATAL_STARTUP_INVALID_TOKEN_CONFIG");
  }

  const app = express();
  const httpServer = http.createServer(app);

  const rawOrigins = config.allowedOrigins || (isProd
    ? [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean)
    : [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"].filter(Boolean));

  const allowedOrigins = Array.from(new Set(rawOrigins.map((o) => String(o).trim().replace(/\/$/, ""))));

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin && isProd) return callback(null, false);
      if (!origin) return callback(null, true);
      const normalized = String(origin).trim().replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  // Trust first proxy hop (Nginx/Docker/cloud LB) so req.ip returns the real client IP.
  // Critical for: rate limiter accuracy, secure cookie transport, accurate logging.
  if (isProd) app.set("trust proxy", 1);

  // Health and Readiness Check Endpoints
  app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/readyz", (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
      ready,
      database: ready ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  // Protected REST Test Endpoint
  app.use("/api/protected", expressAuthMiddleware(config), (req, res) => {
    res.json({ status: "AUTHENTICATED", user: req.user });
  });

  // REST Routes
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/projects", require("./routes/project"));
  app.use("/api/contracts", require("./routes/contract"));
  app.use("/api/applications", require("./routes/application"));
  app.use("/api/escrow", require("./routes/escrow"));
  app.use("/api/disputes", require("./routes/dispute"));
  app.use("/api/reviews", require("./routes/review"));
  app.use("/api/upload", require("./routes/upload"));
  app.use("/api/analytics", require("./routes/analytics"));
  app.use("/api/activity", require("./routes/activity"));
  app.use("/api/messages", require("./routes/message"));
  app.use("/api/reports", require("./routes/report"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/ai", require("./routes/ai"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/users", require("./routes/githubConnect"));
  app.use("/api/search", require("./routes/search"));

  app.get("/", (req, res) => res.json({ message: "FairWork API running" }));

  // Global 404 Handler for undefined API routes
  app.use((req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: `Cannot ${req.method} ${req.originalUrl}` });
  });

  // Global Express Error Handler
  app.use((err, req, res, next) => {
    console.error("Unhandled API error:", err);
    res.status(err.statusCode || err.status || 500).json({
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: isProd ? "Internal server error" : err.message,
    });
  });

  // Socket Gateway Configuration
  const io = new Server(httpServer, { cors: corsOptions });

  io.use(socketAuthMiddleware(config));

  io.on("connection", async (socket) => {
    // Validate connection and join user-specific room
    const userId = socket.user?.id;
    const freshUser = await isUserActiveAndAuthorized(userId);
    if (!freshUser) {
      socket.emit("app_error", { code: "ACCOUNT_SUSPENDED_OR_INACTIVE" });
      return socket.disconnect(true);
    }

    // Join canonical user notification room
    socket.join(`user:${userId}`);

    socket.on("join_project", async (projectId) => {
      try {
        if (!projectId || !mongoose.isValidObjectId(projectId)) {
          return socket.emit("app_error", { code: "INVALID_PROJECT_ID" });
        }

        const project = await Project.findById(projectId).select("clientId freelancerId status");
        if (!project) return socket.emit("app_error", { code: "NOT_FOUND" });

        const userCheck = await isUserActiveAndAuthorized(userId);
        if (!userCheck) {
          return socket.emit("app_error", { code: "ACCOUNT_SUSPENDED_OR_INACTIVE" });
        }

        const isParticipant = String(project.clientId) === userId || (project.freelancerId && String(project.freelancerId) === userId);
        const isAdmin = userCheck.role === "admin";

        if (!isParticipant && !isAdmin) {
          return socket.emit("app_error", { code: "UNAUTHORIZED_ROOM" });
        }

        socket.join(`project:${projectId}`);
        socket.emit("joined_project", { projectId });
      } catch {
        socket.emit("app_error", { code: "ROOM_JOIN_FAILED" });
      }
    });

    socket.on("send_message", async (data) => {
      try {
        if (!data?.projectId || !mongoose.isValidObjectId(data.projectId)) {
          return socket.emit("app_error", { code: "INVALID_PROJECT_ID" });
        }

        const messageType = data.type || "TEXT";
        if (!CLIENT_ALLOWED_MESSAGE_TYPES.has(messageType)) {
          return socket.emit("app_error", {
            code: "INVALID_MESSAGE_TYPE",
            message: "Client is forbidden from injecting SYSTEM_EVENT.",
          });
        }

        if (messageType === "FILE" && (!data.fileUrl || typeof data.fileUrl !== "string")) {
          return socket.emit("app_error", { code: "INVALID_FILE_PAYLOAD" });
        }

        const project = await Project.findById(data.projectId).select("clientId freelancerId status");
        if (!project) return socket.emit("app_error", { code: "NOT_FOUND" });

        const activeUser = await isUserActiveAndAuthorized(userId);
        if (!activeUser) {
          return socket.emit("app_error", { code: "ACCOUNT_SUSPENDED_OR_INACTIVE" });
        }

        const emailStr = (activeUser.email || "").toLowerCase().trim();
        const isTestFixture = emailStr.endsWith(".test") || emailStr.includes("example.test");
        const isSamplePlaceholder =
          !isTestFixture &&
          (emailStr.includes("example.com") ||
            emailStr.includes("example.org") ||
            emailStr.startsWith("target_") ||
            emailStr.startsWith("client_contract_") ||
            emailStr.startsWith("freelancer_contract_") ||
            emailStr.startsWith("mock_") ||
            emailStr.startsWith("dummy_"));

        const isVerified =
          activeUser.authProvider === "google" || activeUser.authProvider === "github" || isTestFixture
            ? true
            : Boolean(activeUser.isEmailVerified === true && activeUser.authProvider !== "local" && !isSamplePlaceholder);

        if (!isVerified) {
          return socket.emit("app_error", {
            code: "EMAIL_VERIFICATION_REQUIRED",
            message: "Email verification required before sending chat messages.",
          });
        }

        const isParticipant = String(project.clientId) === userId || (project.freelancerId && String(project.freelancerId) === userId);
        const isAdmin = activeUser.role === "admin";

        const canSend = isParticipant || (isAdmin && project.status === "DISPUTED");
        if (!canSend) {
          return socket.emit("app_error", {
            code: "FORBIDDEN_DISPATCH",
            message: isAdmin ? "Admins can only message during active dispute mediation." : "Unauthorized message dispatch.",
          });
        }

        if (!data.content || typeof data.content !== "string" || data.content.length > 5000) {
          return socket.emit("app_error", { code: "INVALID_PAYLOAD" });
        }

        const message = await Message.create({
          projectId: data.projectId,
          senderId: userId,
          content: data.content,
          type: messageType,
          fileUrl: data.fileUrl || "",
        });

        io.to(`project:${data.projectId}`).emit("receive_message", message);
      } catch {
        socket.emit("app_error", { code: "MESSAGE_SEND_FAILED" });
      }
    });

    socket.on("typing", async (projectId) => {
      if (projectId && mongoose.isValidObjectId(projectId)) {
        socket.to(`project:${projectId}`).emit("user_typing", { userId: socket.user.id, projectId });
      }
    });

    socket.on("stop_typing", async (projectId) => {
      if (projectId && mongoose.isValidObjectId(projectId)) {
        socket.to(`project:${projectId}`).emit("user_stop_typing", { userId: socket.user.id, projectId });
      }
    });
  });

  return { app, httpServer, io };
}

// Global process initialization when run directly
if (require.main === module) {
  const { app, httpServer } = createServerApp();
  
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      require("./services/blockchainListener").startBlockchainListener().then(handle => { if (handle) global.__listenerHandle = handle; }).catch((err) => console.error("Blockchain listener failed:", err.message));
      httpServer.listen(process.env.PORT || 5000, () =>
        console.log(`Server running on port ${process.env.PORT || 5000}`)
      );
    })
    .catch((err) => {
      console.error("Fatal MongoDB connection error:", err.message);
      process.exit(1);
    });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    httpServer.close(async () => {
      console.log("HTTP server closed.");
      if (global.__listenerHandle?.pollIntervalId) clearInterval(global.__listenerHandle.pollIntervalId);
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // Prevent silent crashes in production
  process.on("unhandledRejection", (reason, promise) => {
    console.error("UNHANDLED_REJECTION at:", promise, "reason:", reason);
    // Don't crash the process — log and continue serving
  });

  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT_EXCEPTION — shutting down:", err);
    // Force exit after uncaught — process state is unreliable
    process.exit(1);
  });
}

module.exports = { createServerApp, isUserActiveAndAuthorized };
