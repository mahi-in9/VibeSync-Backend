import express from "express";
import { serviceProxy } from "../utils/serviceProxy.js";
import verifyToken from "../../shared/middleware/verifyToken.js";

const router = express.Router();
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL;

// -------------------------
// Public GET routes
// -------------------------
router.get("/", serviceProxy(EVENT_SERVICE_URL)); // all events
router.get("/public", serviceProxy(EVENT_SERVICE_URL)); // public events
router.get("/nearby", serviceProxy(EVENT_SERVICE_URL)); // nearby events
router.get("/group/:groupId", serviceProxy(EVENT_SERVICE_URL)); // group events
router.get("/:id", serviceProxy(EVENT_SERVICE_URL)); // single event

// -------------------------
// Protected routes (require auth)
// -------------------------
router.use(verifyToken());
router.all("/", serviceProxy(EVENT_SERVICE_URL)); // everything else goes through auth

export default router;
