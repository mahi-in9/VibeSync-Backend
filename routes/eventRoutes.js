import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addOrUpdateRSVP,
  removeRSVP,
  cancelEvent,
  getPublicEvents,
  getNearbyEvents,
  getGroupEvents,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/public", getPublicEvents);
router.get("/nearby", getNearbyEvents);
router.get("/group/:groupId", getGroupEvents);
router.get("/:id", getEventById);

router.use(authMiddleware());

router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);
router.post("/:id/rsvp", addOrUpdateRSVP);

router.delete("/:id/rsvp", removeRSVP);
router.patch("/:id/cancel", cancelEvent);

export default router;
