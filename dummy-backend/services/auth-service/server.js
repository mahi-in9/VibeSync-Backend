import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "../../shared/config/db.js";

dotenv.config();
const app = express();

// middleware
app.use(express.json());
app.use(cors());

// mongoDB connection
connectDB();

// api health
app.get("/", (req, res) => {
  res.send("Api is running");
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Auth Service running on port http://localhost:${PORT}`)
);
