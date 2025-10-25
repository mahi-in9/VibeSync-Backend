import express from "express";
import { serviceProxy } from "../utils/serviceProxy.js";

const router = express.Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Catch all /auth requests and proxy to Auth Service
router.use("/", serviceProxy(AUTH_SERVICE_URL));

export default router;
