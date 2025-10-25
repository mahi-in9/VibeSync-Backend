import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

// --- Connect to MongoDB ---
connectDB();

const app = express();

// --- Middleware ---
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

// --- HTTP server & Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// --- Socket.IO Events ---
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      // Send message to your backend
      const axiosResponse = await axios.post(
        `${process.env.BACKEND_URL || "http://localhost:5000"}/api/messages`,
        data,
        { headers: { Authorization: data.token } }
      );

      const message = axiosResponse.data.message;

      // Broadcast message to group
      io.to(data.groupId).emit("newMessage", message);
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/messages", messageRoutes);

// --- Health check ---
app.get("/", (req, res) => res.send("🚀 API is running"));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
