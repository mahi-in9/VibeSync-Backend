import express from "express";
import {
  createPoll,
  getGroupPolls,
  votePoll,
  closePoll,
} from "../controllers/pollController.js";

const router = express.Router();

// Public (read-only)
router.get("/group/:groupId", getGroupPolls);

// Protected (API Gateway handles auth)
router.post("/", createPoll);
router.post("/:pollId/vote", votePoll);
router.patch("/:pollId/close", closePoll);

export default router;
