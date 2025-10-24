import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import groupRoutes from "./routes/groupRoutes.js";

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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected for Group Service"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Group Service running on port ${PORT}`));
