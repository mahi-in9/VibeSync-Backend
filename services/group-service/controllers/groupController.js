import Group from "../models/Group.js";

// ----create group----
export const createGroup = async (req, res) => {
  try {
    const { name, description, privacy, tags } = req.body;

    if (!name || !name.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

    if (privacy && !["public", "private", "secret"].includes(privacy)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid privacy value" });
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description?.trim(),
      privacy: privacy || "public",
      tags: tags || [],
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }], // auto-add owner as admin
    });

    await newGroup.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", err);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get all groups
export const getAllGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, privacy, search } = req.query;

    let query = {};
    if (privacy && ["public", "private", "secret"].includes(privacy)) {
      query.privacy = privacy;
    }

    // search
    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search.trim(), $optoins: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total = await Group.countDocuments(query);

    const groups = await Group.find(query)
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate("events")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      groups,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ success: false, message: error.message });
  }
};

// join group
export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params; // group id
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    group.members.push(userId);
    await group.save();

    res
      .status(200)
      .json({ success: true, message: "Joined group successfully", group });
  } catch (error) {
    console.error("Error joining group:", err);
    res.status(500).json({ success: false, message: error.message });
  }
};

// leave Group
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    res
      .status(200)
      .json({ success: true, message: "Left group successfully", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// delete group
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await group.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
