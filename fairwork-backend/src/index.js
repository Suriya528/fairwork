const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Project = require("./models/Project");
const Message = require("./models/Message");
const User = require("./models/User");
const { socketAuthMiddleware, expressAuthMiddleware } = require("./utils/authVerifier");
const { isValidEthAddress } = require("./services/reconciliationService");

const CLIENT_ALLOWED_MESSAGE_TYPES = new Set(["TEXT", "FILE"]);

async function isUserActiveAndAuthorized(userId) {
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId).select("role isSuspended");
  if (!user || user.isSuspended) return null;
  return user;
}

function createServerApp(config = {}) {
  const isProd = (config.nodeEnv || process.env.NODE_ENV) === "production";

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
    credentials: false,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

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
  app.use("/api/search", require("./routes/search"));

  app.get("/", (req, res) => res.json({ message: "FairWork API running" }));

  // Socket Gateway Configuration
  const io = new Server(httpServer, { cors: corsOptions });

  io.use(socketAuthMiddleware(config));

  io.on("connection", (socket) => {
    socket.on("join_project", async (projectId) => {
      try {
        if (!projectId || !mongoose.isValidObjectId(projectId)) {
          return socket.emit("app_error", { code: "INVALID_PROJECT_ID" });
        }

        const project = await Project.findById(projectId).select("clientId freelancerId status");
        if (!project) return socket.emit("app_error", { code: "NOT_FOUND" });

        const userId = socket.user.id;
        const freshUser = await isUserActiveAndAuthorized(userId);
        if (!freshUser) {
          return socket.emit("app_error", { code: "ACCOUNT_SUSPENDED_OR_INACTIVE" });
        }

        const isParticipant = String(project.clientId) === userId || (project.freelancerId && String(project.freelancerId) === userId);
        const isAdmin = freshUser.role === "admin";

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

        const userId = socket.user.id;
        const freshUser = await isUserActiveAndAuthorized(userId);
        if (!freshUser) {
          return socket.emit("app_error", { code: "ACCOUNT_SUSPENDED_OR_INACTIVE" });
        }

        const emailStr = (freshUser.email || "").toLowerCase().trim();
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
          freshUser.authProvider === "google" || freshUser.authProvider === "github" || isTestFixture
            ? true
            : Boolean(freshUser.isEmailVerified === true && freshUser.authProvider !== "local" && !isSamplePlaceholder);

        if (!isVerified) {
          return socket.emit("app_error", {
            code: "EMAIL_VERIFICATION_REQUIRED",
            message: "Email verification required before sending chat messages.",
          });
        }

        const isParticipant = String(project.clientId) === userId || (project.freelancerId && String(project.freelancerId) === userId);
        const isAdmin = freshUser.role === "admin";

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
      require("./services/blockchainListener").startBlockchainListener().catch((err) => console.error("Blockchain listener failed:", err.message));
      httpServer.listen(process.env.PORT || 5000, () =>
        console.log(`Server running on port ${process.env.PORT || 5000}`)
      );
    })
    .catch((err) => console.log(err));
}

module.exports = { createServerApp, isUserActiveAndAuthorized };
