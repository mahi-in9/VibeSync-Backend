import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../../shared/config/db.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/events", eventRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Event Service is running...");
});

// Database connection
await connectDB;

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`🚀 Event Service running on port ${PORT}`));
