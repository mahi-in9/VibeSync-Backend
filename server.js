import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

// mongoose connect
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a group room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Leave a group room
  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  // Send message event
  socket.on("sendMessage", async (data) => {
    // data: { sender, groupId, content }
    try {
      // Optionally save to DB
      const axiosResponse = await axios.post(
        `${process.env.MESSAGE_SERVICE_URL}/messages`,
        data,
        {
          headers: { Authorization: data.token },
        }
      );

      const message = axiosResponse.data.message;

      // Broadcast to group room
      io.to(data.groupId).emit("newMessage", message);
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/polls", pollRoutes);
app.use("/messages", messageRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 API is running on port http://localhost:${PORT}`)
);
