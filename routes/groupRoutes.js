import express from "express";
import {
  createGroup,
  getAllGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupById,
  promoteMember,
  demoteMember,
  transferOwnership,
  requestToJoin,
} from "../controllers/groupController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllGroups);
router.get("/:id", getGroupById);

// Authenticated routes
router.use(authMiddleware());

// Group management
router.post("/", createGroup);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);

// Private group join request
router.post("/:id/request-to-join", requestToJoin);

// Member management
router.post("/:id/promote/:memberId", promoteMember);
router.post("/:id/demote/:memberId", demoteMember);
router.post("/:id/transfer-ownership/:newOwnerId", transferOwnership);

export default router;
