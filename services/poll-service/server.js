import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import pollRoutes from "./routes/pollRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/polls", pollRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Poll Service is running...");
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected for Poll Service"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`🚀 Poll Service running on port ${PORT}`));
