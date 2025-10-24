import express from "express";
import {
  createEvent,
  getPublicEvents,
  getNearbyEvents,
  rsvpEvent,
  cancelEvent,
  getGroupEvents,
} from "../controllers/eventController.js";

const router = express.Router();

// Public routes
router.get("/", getPublicEvents);
router.get("/nearby", getNearbyEvents);
router.get("/group/:groupId", getGroupEvents);

// Protected routes (Gateway handles auth)
router.post("/", createEvent);
router.post("/:id/rsvp", rsvpEvent);
router.patch("/:id/cancel", cancelEvent);

export default router;
