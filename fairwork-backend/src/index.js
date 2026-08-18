const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Routes
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
app.use("/api/admin", require("./routes/admin"));

app.get("/", (req, res) => res.json({ message: "FairWork API running" }));

// Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.id);

  // Join project room
  socket.on("join_project", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.user.id} joined project ${projectId}`);
  });

  // Send message
  socket.on("send_message", async (data) => {
    const Message = require("./models/Message");
    const message = await Message.create({
      projectId: data.projectId,
      senderId: socket.user.id,
      content: data.content,
      fileUrl: data.fileUrl || "",
    });
    const populated = await message.populate("senderId", "firstName lastName avatarUrl");
    io.to(data.projectId).emit("receive_message", populated);
  });

  // Typing indicator
  socket.on("typing", (projectId) => {
    socket.to(projectId).emit("user_typing", socket.user.id);
  });

  // Dispute notification
  socket.on("dispute_raised", (projectId) => {
    io.to(projectId).emit("dispute_alert", {
      message: "A dispute has been raised on this project",
      projectId,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.id);
  });
});

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
