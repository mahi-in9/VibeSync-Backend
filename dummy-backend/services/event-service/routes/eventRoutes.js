// services/event-service/routes/eventRoutes.js
import express from "express";
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
import verifyToken from "../../../shared/middleware/verifyToken.js";

const router = express.Router();

// --- Event CRUD ---
router.post("/", verifyToken, createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.put("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);

// --- RSVP ---
router.post("/:id/rsvp", verifyToken, addOrUpdateRSVP);
router.delete("/:id/rsvp", verifyToken, removeRSVP);

// --- Event Cancellation ---
router.patch("/:id/cancel", verifyToken, cancelEvent);

// --- Public / Group / Nearby Events ---
router.get("/public", getPublicEvents);
router.get("/nearby", getNearbyEvents);
router.get("/group/:groupId", getGroupEvents);

export default router;
