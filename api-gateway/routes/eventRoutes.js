import express from "express";
import { serviceProxy } from "../utils/serviceProxy.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL;

// Public GET routes
router.get("/:path(*)", serviceProxy(EVENT_SERVICE_URL));

// Protected routes (POST, PATCH, DELETE)
router.use(verifyToken);
router.all("/:path(*)", serviceProxy(EVENT_SERVICE_URL));

export default router;
