import express from "express";
import { serviceProxy } from "../utils/serviceProxy.js";
import verifyToken from "../../shared/middleware/verifyToken.js";

const router = express.Router();
const GROUP_SERVICE_URL = process.env.GROUP_SERVICE_URL;

// Public GET routes
router.get("/", serviceProxy(GROUP_SERVICE_URL));

// Protected routes (POST, PATCH, DELETE)
router.use(verifyToken);
router.all("/", serviceProxy(GROUP_SERVICE_URL));

export default router;
