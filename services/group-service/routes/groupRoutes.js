import express from "express";
import {
  createGroup,
  getAllGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupController.js";
import authMiddleware from "../../auth-service/middleware/authMiddleware.js";

const router = express.Router();

// public
router.get("/", getAllGroups);

// auth protected (API Gateway will handle authentication)
router.post("/", createGroup);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);

export default router;
