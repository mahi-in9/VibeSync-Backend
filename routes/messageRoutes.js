import express from "express";
import {
  sendMessage,
  getMessagesByGroup,
  deleteMessage,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware(), sendMessage);
router.get("/:groupId", authMiddleware(), getMessagesByGroup);
router.delete("/:id", authMiddleware(), deleteMessage);

export default router;
