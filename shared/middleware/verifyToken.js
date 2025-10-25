import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

let User;
try {
  User = mongoose.model("User");
} catch (err) {
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: { type: String, default: "user" },
  });
  User = mongoose.model("User", userSchema);
}

const verifyToken = (...allowedRoles) => {
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
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }

      // Fetch user from auth database
      const user = await User.findById(payload.userId).select("-password");
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "User not found" });

      req.user = user;

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have access to this resource.",
        });
      }

      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
};

export default verifyToken;
