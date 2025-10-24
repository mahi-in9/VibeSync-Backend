import Group from "../models/Group.js";

/**
 * @desc Create a new group
 * @route POST /api/groups
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, creator, tags, location, isPrivate } = req.body;

    const group = await Group.create({
      name,
      description,
      creator,
      members: [creator],
      tags,
      location,
      isPrivate,
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all public groups
 * @route GET /api/groups
 */
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isPrivate: false }).populate(
      "creator",
      "name email"
    );
    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Join a group
 * @route POST /api/groups/:id/join
 */
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
      return res
        .status(400)
        .json({ success: false, message: "User already in group" });
    }

    group.members.push(userId);
    await group.save();

    res
      .status(200)
      .json({ success: true, message: "Joined group successfully", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Leave a group
 * @route POST /api/groups/:id/leave
 */
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

/**
 * @desc Delete a group
 * @route DELETE /api/groups/:id
 */
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
