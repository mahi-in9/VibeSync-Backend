import express from "express";
import {
  getUserProfile,
  updateProfile,
  deleteProfile,
  getProfiles,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected user routes
router.get("/me", authMiddleware(), getUserProfile);
router.put("/update", authMiddleware(), updateProfile);
router.delete("/delete", authMiddleware(), deleteProfile);
router.get("/all", authMiddleware(), getProfiles);

export default router;
