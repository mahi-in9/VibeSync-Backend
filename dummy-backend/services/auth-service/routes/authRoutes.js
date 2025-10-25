import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  verifyResetToken,
  forgotPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware(), logoutUser);

router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.post("/reset-password", resetPassword);

export default router;
