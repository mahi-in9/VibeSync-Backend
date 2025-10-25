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
import authMiddleware from "../../auth-service/middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllGroups);
router.get("/:id", getGroupById);

// Authenticated routes (user must be logged in)
router.use(authMiddleware);

// Group management
router.post("/", createGroup); // create group
router.post("/:id/join", joinGroup); // join public group
router.post("/:id/leave", leaveGroup); // leave group
router.delete("/:id", deleteGroup); // delete group (owner only)

// Private group join request
router.post("/:id/request-to-join", requestToJoin);

// Member management (owner only)
router.post("/:id/promote/:memberId", promoteMember);
router.post("/:id/demote/:memberId", demoteMember);
router.post("/:id/transfer-ownership/:newOwnerId", transferOwnership);

export default router;
