import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware(), getUserProfile);

router.get("/admin", authMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

export default router;
