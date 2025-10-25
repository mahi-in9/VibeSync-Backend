// services/poll-service/routes/pollRoutes.js
import express from "express";
import {
  createPoll,
  getAllPolls,
  getPollById,
  votePoll,
  removeVote,
  closePoll,
} from "../controllers/pollController.js";
import verifyToken from "../../../shared/middleware/verifyToken.js";

const router = express.Router();

// -------------------------
// Public routes
// -------------------------
router.get("/", getAllPolls); // Get all polls
router.get("/:id", getPollById); // Get poll by ID

// -------------------------
// Protected routes (require auth)
// -------------------------
router.use(verifyToken()); // All routes below require JWT

router.post("/", createPoll); // Create new poll
router.post("/:id/vote", votePoll); // Cast vote
router.delete("/:id/vote", removeVote); // Remove vote
router.patch("/:id/close", closePoll); // Close poll

export default router;
