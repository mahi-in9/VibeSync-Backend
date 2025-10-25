import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRateLimiter } from "./middleware/rateLimiter.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/polls", pollRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
