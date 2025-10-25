import express from "express";
import {
  createPoll,
  getAllPolls,
  getPollById,
  votePoll,
  removeVote,
  closePoll,
} from "../controllers/pollController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllPolls);
router.get("/:id", getPollById);

router.use(authMiddleware());

router.post("/", createPoll);
router.post("/:id/vote", votePoll);
router.delete("/:id/vote", removeVote);
router.patch("/:id/close", closePoll);

export default router;
