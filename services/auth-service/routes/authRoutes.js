import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateProfile,
  deleteProfile,
  requestPasswordReset,
  resetPassword,
  getProfiles,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware(), logoutUser);

router.get("/me", authMiddleware(), getUserProfile);
router.put("/me", authMiddleware(), updateProfile);
router.delete("/me", authMiddleware(), deleteProfile);

router.get("/profiles", authMiddleware(), getProfiles);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
