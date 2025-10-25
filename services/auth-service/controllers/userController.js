// controllers/userController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Group from "../../group-service/models/Group.js";

// --- Get User Profile ---
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Update Profile ---
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password, avatar, latitude, longitude, address } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (password) user.password = await bcrypt.hash(password, 10);

    if (latitude && longitude) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude], // GeoJSON order: [lng, lat]
        address: address || user.location?.address || "",
      };
    }

    await user.save();

    res.status(200).json({
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
    res.status(500).json({ message: err.message });
  }
};


// --- Delete Profile ---
export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Group.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );
    await user.deleteOne();

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Get All Profiles (Admin/User Dashboard) ---
export const getProfiles = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    const users = await User.find().select("-password");

    const profiles = await Promise.all(
      users.map(async (user) => {
        const totalGroups = await Group.countDocuments({ members: user._id });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          totalGroups,
          canEdit:
            currentUserId.toString() === user._id.toString() ||
            currentUserRole === "admin",
          canDelete:
            currentUserId.toString() === user._id.toString() ||
            currentUserRole === "admin",
        };
      })
    );

    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
