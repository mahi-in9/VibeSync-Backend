import Message from "../models/Message.js";
import axios from "axios";

// Send new message
export const sendMessage = async (req, res) => {
  try {
    const { groupId, content, attachments } = req.body;
    const senderId = req.user.id;

    // Check if group exists via API Gateway route
    const groupResponse = await axios.get(`/api/groups/${groupId}`);
    if (!groupResponse.data || !groupResponse.data.success) {
      return res.status(404).json({ message: "Group not found" });
    }

    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content,
      attachments,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all messages in a group
export const getMessagesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ group: groupId }).sort({
      createdAt: 1,
    });

    // Fetch sender details via API Gateway route
    const senderIds = [...new Set(messages.map((m) => m.sender.toString()))];
    const usersResponse = await axios.post(`/api/users/batch`, {
      ids: senderIds,
    });
    const usersMap = {};
    if (usersResponse.data.success) {
      usersResponse.data.users.forEach((u) => {
        usersMap[u._id] = u;
      });
    }

    const messagesWithUser = messages.map((m) => ({
      _id: m._id,
      group: m.group,
      content: m.content,
      attachments: m.attachments,
      createdAt: m.createdAt,
      sender: usersMap[m.sender.toString()] || {
        _id: m.sender,
        name: "Unknown",
      },
    }));

    res.json({ success: true, messages: messagesWithUser });
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a message (only sender or group admin)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== requesterId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Delete message error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
