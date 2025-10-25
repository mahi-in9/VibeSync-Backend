import Group from "../models/Group.js";
import { getIO } from "../../../shared/config/socket.js";

// utility
const isOwner = (group, userId) => group.owner.toString() === userId.toString();
const findMember = (group, userId) =>
  group.members.find((m) => m.user.toString() === userId.toString());

//Create Group
export const createGroup = async (req, res) => {
  try {
    const { name, description, privacy, tags } = req.body;

    if (!name || name.trim().length === 0) {
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
      data: newGroup,
    });
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get all groups
export const getAllGroups = async (req, res) => {
  try {
    let { page = 1, limit = 10, privacy, search, sortBy, order } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    order = order === "asc" ? 1 : -1;

    const query = {};

    if (privacy && ["public", "private", "secret"].includes(privacy)) {
      query.privacy = privacy;
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Sorting options
    let sortOptions = {};
    if (sortBy === "name") sortOptions.name = order;
    else if (sortBy === "members") sortOptions["members.length"] = order;
    else sortOptions.createdAt = order;

    const total = await Group.countDocuments(query);

    const groups = await Group.aggregate([
      { $match: query },
      {
        $addFields: {
          memberCount: { $size: "$members" },
        },
      },
      { $sort: sortBy === "members" ? { memberCount: order } : sortOptions },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const populatedGroups = await Group.populate(groups, [
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      message: "Groups fetched successfully",
      data: populatedGroups,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// join Group
export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    // Already in group
    if (findMember(group, userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Private group → send request, don’t auto-join
    if (group.privacy === "private") {
      if (
        group.joinRequests?.some((r) => r.user.toString() === userId.toString())
      ) {
        return res.status(400).json({
          success: false,
          message: "You already sent a join request to this private group",
        });
      }

      group.joinRequests.push({ user: userId });
      await group.save();

      const io = getIO();
      io.emit("group:join-request", { groupId: id, userId });

      return res.status(200).json({
        success: true,
        message: "Join request sent successfully",
      });
    }

    // Public group → direct join
    group.members.push({ user: userId, role: "member" });
    await group.save();

    io.emit("group:joined", { groupId: id, userId });

    res.status(200).json({
      success: true,
      message: "Joined group successfully",
      data: group,
    });
  } catch (error) {
    console.error("❌ Error joining group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// leave group
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    if (isOwner(group, userId))
      return res.status(400).json({
        success: false,
        message:
          "Owner cannot leave their own group. Transfer ownership first.",
      });

    const prevCount = group.members.length;
    group.members = group.members.filter((m) => m.user.toString() !== userId);

    if (group.members.length === prevCount) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: "Left group successfully",
      data: group,
    });
  } catch (error) {
    console.error("❌ Error leaving group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// delete group
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    if (!isOwner(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the owner can delete the group",
      });
    }

    await group.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get group by Id
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate("events");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    console.error("❌ Error fetching group details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// promote member
export const promoteMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (!isOwner(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can promote members",
      });
    }

    const member = findMember(group, memberId);
    if (!member)
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });

    member.role = "admin";
    await group.save();

    res.status(200).json({
      success: true,
      message: "Member promoted to admin",
      data: group,
    });
  } catch (error) {
    console.error("❌ Error promoting member:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// demote admin
export const demoteMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (!isOwner(group, userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Only the owner can demote admins" });
    }

    const member = findMember(group, memberId);
    if (!member)
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });

    member.role = "member";
    await group.save();

    res
      .status(200)
      .json({ success: true, message: "Admin demoted to member", data: group });
  } catch (error) {
    console.error("❌ Error demoting member:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Transfer Ownership
 */
export const transferOwnership = async (req, res) => {
  try {
    const { id, newOwnerId } = req.params;
    const userId = req.user._id; // current owner

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the current owner can transfer ownership",
      });
    }

    const member = group.members.find((m) => m.user.toString() === newOwnerId);
    if (!member) {
      return res
        .status(400)
        .json({ success: false, message: "New owner must be a group member" });
    }

    group.owner = newOwnerId;
    member.role = "admin";
    await group.save();

    res.status(200).json({
      success: true,
      message: "Ownership transferred successfully",
      data: group,
    });
  } catch (error) {
    console.error("❌ Error transferring ownership:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Request to Join (for private groups)
 */
export const requestToJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.privacy !== "private") {
      return res.status(400).json({
        success: false,
        message: "Join request only allowed for private groups",
      });
    }

    if (group.members.some((m) => m.user.toString() === userId.toString())) {
      return res
        .status(400)
        .json({ success: false, message: "You are already a member" });
    }

    if (!group.joinRequests) group.joinRequests = [];
    if (group.joinRequests.includes(userId.toString())) {
      return res
        .status(400)
        .json({ success: false, message: "You already requested to join" });
    }

    group.joinRequests.push(userId);
    await group.save();

    const io = getIO();
    io.emit("group:join-request", { groupId: id, userId });
    res
      .status(200)
      .json({ success: true, message: "Join request sent successfully" });
  } catch (error) {
    console.error("❌ Error requesting to join group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
