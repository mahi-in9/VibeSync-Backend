import express from "express";
import {
  createGroup,
  getAllGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = express.Router();

// Public routes
router.get("/", getAllGroups);

// Auth-protected routes (API Gateway will handle authentication)
router.post("/", createGroup);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);

export default router;
