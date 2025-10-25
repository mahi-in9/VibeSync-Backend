import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http"; // ✅ import http
import connectDB from "../../shared/config/db.js";
import groupRoutes from "./routes/groupRoutes.js";
import { initSocket } from "../../shared/config/socket.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/groups", groupRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Group Service is running...");
});

// MongoDB Connection
await connectDB();

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize socket.io with the server
initSocket(server);

// Start Server (✅ use server.listen, not app.listen)
const PORT = process.env.PORT || 5002;
server.listen(PORT, () =>
  console.log(`🚀 Group Service running on port ${PORT}`)
);
