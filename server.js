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
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
// app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
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
      // Save message in DB
      const res = await axios.post(
        `${process.env.BACKEND_URL}/api/messages`,
        data,
        { headers: { Authorization: data.token } }
      );

      const message = res.data.message;

      // Broadcast to only the group room
      io.to(data.groupId).emit("newMessage", message);
    } catch (err) {
      console.error("Send message error:", err.message);
    }
  });

  // --- Real-time Poll Events ---
  socket.on("votePoll", async ({ pollId, optionId, token }) => {
    try {
      const res = await axios.post(
        `${process.env.BACKEND_URL}/api/polls/${pollId}/vote`,
        { optionId },
        { headers: { Authorization: token } }
      );
      // Broadcast updated poll to all connected clients
      io.emit("pollUpdated", res.data.data);
    } catch (err) {
      console.error("Vote poll error:", err.message);
    }
  });

  socket.on("removeVote", async ({ pollId, token }) => {
    try {
      const res = await axios.delete(
        `${process.env.BACKEND_URL}/api/polls/${pollId}/vote`,
        { headers: { Authorization: token } }
      );
      io.emit("pollUpdated", res.data.data);
    } catch (err) {
      console.error("Remove vote error:", err.message);
    }
  });

  socket.on("closePoll", async ({ pollId, token }) => {
    try {
      const res = await axios.patch(
        `${process.env.BACKEND_URL}/api/polls/${pollId}/close`,
        {},
        { headers: { Authorization: token } }
      );
      io.emit("pollUpdated", res.data.data);
    } catch (err) {
      console.error("Close poll error:", err.message);
    }
  });

  // --- Real-time RSVP Events ---
  socket.on("updateRSVP", async ({ eventId, status, token }) => {
    try {
      const res = await axios.post(
        `${process.env.BACKEND_URL}/api/events/${eventId}/rsvp`,
        { status },
        { headers: { Authorization: token } }
      );
      io.emit("rsvpUpdated", { eventId, rsvp: res.data.event.rsvp });
    } catch (err) {
      console.error("RSVP update error:", err.message);
    }
  });

  socket.on("removeRSVP", async ({ eventId, token }) => {
    try {
      const res = await axios.delete(
        `${process.env.BACKEND_URL}/api/events/${eventId}/rsvp`,
        { headers: { Authorization: token } }
      );
      io.emit("rsvpUpdated", { eventId, rsvp: res.data.event.rsvp });
    } catch (err) {
      console.error("RSVP remove error:", err.message);
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
