import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Group from "../models/Group.js";

// --- Get User Profile ---
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Update Profile ---
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const { name, email, password, avatar, latitude, longitude, address } =
      req.body;

    if (name) user.name = name;

    // ✅ Validate email uniqueness
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    if (avatar) user.avatar = avatar;

    if (password) user.password = await bcrypt.hash(password, 10);

    // ✅ Update GeoJSON location safely
    if (latitude && longitude) {
      user.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)], // GeoJSON order
        address: address || user.location?.address || "",
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        location: user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Delete Profile ---
export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Remove user from all groups
    await Group.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Get All Profiles (Admin/User Dashboard) ---
export const getProfiles = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    // ✅ Fetch all users efficiently
    const users = await User.find().select("-password").lean();

    // ✅ Aggregate group counts once instead of N+1 queries
    const groupCounts = await Group.aggregate([
      { $unwind: "$members" },
      { $group: { _id: "$members", totalGroups: { $sum: 1 } } },
    ]);

    const groupMap = Object.fromEntries(
      groupCounts.map((g) => [g._id.toString(), g.totalGroups])
    );

    const profiles = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      totalGroups: groupMap[user._id.toString()] || 0,
      canEdit:
        currentUserId.toString() === user._id.toString() ||
        currentUserRole === "admin",
      canDelete:
        currentUserId.toString() === user._id.toString() ||
        currentUserRole === "admin",
    }));

    res.status(200).json({
      success: true,
      profiles,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
