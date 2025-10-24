import express from "express";
import { serviceProxy } from "../utils/serviceProxy.js";

const router = express.Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Proxy all auth requests
router.use("/:path(*)", serviceProxy(AUTH_SERVICE_URL));

export default router;
