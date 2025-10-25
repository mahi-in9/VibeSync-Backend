import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Group from "../../group-service/models/Group.js";
// import Message from "../models/Message.js";
import { sendEmail } from "../utils/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// genrate token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// --- register ---
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    await sendEmail({
      to: newUser.email,
      subject: "Welcome to VibeSync!",
      text: `Hi ${newUser.name}, welcome to VibeSync!`,
      html: `<h1>Hi ${newUser.name},</h1><p>Welcome to <b>VibeSync</b>! We're excited to have you.</p>`,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// --- login ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- logout ---
export const logoutUser = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// forget password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });

    // Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = expiry;
    await user.save();

    // Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Click below to continue:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// verify reset password
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });

    res.status(200).json({ message: "Valid token", email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// reset
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 🔐 Hash the incoming token (same way you hashed it when saving)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 🔎 Find user by hashed token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // 🧂 Hash and set new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
