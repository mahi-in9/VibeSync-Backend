import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization header missing or invalid.",
        });
      }

      const token = authHeader.split(" ")[1];
      console.log("🔹 Incoming Token:", token);
      console.log("🔹 JWT_SECRET being used:", JWT_SECRET);

      let payload;
      try {
        payload = await jwt.verify(token, JWT_SECRET);
        console.log("✅ Token verified successfully:", payload);
      } catch (err) {
        console.error("❌ JWT verification error:", err.message);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }

      // Attach user to request
      const user = await User.findById(payload.userId).select("-password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      req.user = user;

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have access to this resource.",
        });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
};

export default authMiddleware;
