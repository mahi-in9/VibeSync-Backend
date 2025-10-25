import Event from "../models/Event.js";
import mongoose from "mongoose";

let Group = null;
const GROUP_MODEL_PATHS = ["../models/Group.js"];

(async function tryLoadGroup() {
  for (const p of GROUP_MODEL_PATHS) {
    try {
      const mod = await import(p);
      Group = mod.default ?? mod.Group ?? mod;
      if (Group) {
        console.info(`Loaded Group model from: ${p}`);
        break;
      }
    } catch (err) {}
  }
  if (!Group) {
    console.warn(
      "Group model not found. Group-related endpoints will return a helpful 500 message. " +
        "If Group lives in this service, update GROUP_MODEL_PATHS or replace dynamic import with a static one."
    );
  }
})();

const sendError = (res, code, message, err = null) =>
  res.status(code).json({
    success: false,
    message,
    error: err ? err.message || err : undefined,
  });

export const createEvent = async (req, res) => {
  if (!req.user || !req.user._id) {
    return sendError(res, 401, "Unauthorized. Login required.");
  }

  const {
    title,
    date,
    time,
    group,
    capacity,
    visibility,
    location,
    attendees,
    description,
    tags,
    isCancelled,
  } = req.body;

  if (!title || !date || !time) {
    return sendError(
      res,
      400,
      "Validation error: title, date, and time are required."
    );
  }

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) {
    return sendError(res, 400, "Validation error: invalid 'date' format.");
  }

  const cap = capacity ? parseInt(capacity, 10) : 50;
  if (cap <= 0)
    return sendError(res, 400, "Validation error: capacity must be > 0.");

  if (group) {
    if (!Group) {
      return sendError(
        res,
        500,
        "Group model missing on the server. Fix imports."
      );
    }

    let existingGroup;
    try {
      existingGroup = await Group.findById(group).lean();
    } catch (err) {
      return sendError(res, 400, "Invalid group id format.", err);
    }

    if (!existingGroup) {
      return sendError(res, 404, "Group not found.");
    }

    if (existingGroup.members && Array.isArray(existingGroup.members)) {
      const isMember = existingGroup.members.some((m) => {
        if (!m) return false;
        const userId = m.user ? m.user.toString() : m.toString();
        return userId === req.user._id.toString();
      });
      if (!isMember) {
        return sendError(
          res,
          403,
          "Only group members can create events in this group."
        );
      }
    }
  }

  // Use a transaction if you plan to update multiple collections (e.g., add event id to group)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const event = new Event({
      title,
      description,
      date: eventDate,
      time,
      createdBy: req.user._id,
      group: group || null,
      location: location || undefined,
      attendees: attendees || [],
      capacity: cap,
      tags: tags || [],
      visibility: visibility || "group-only",
      isCancelled: !!isCancelled,
    });

    // Save event
    const savedEvent = await event.save({ session });
    if (group && Group) {
      try {
        await Group.findByIdAndUpdate(
          group,
          { $addToSet: { events: savedEvent._id } },
          { session, new: true }
        );
      } catch (err) {
        throw new Error("Failed to link event to group: " + err.message);
      }
    }

    await session.commitTransaction();
    session.endSession();

    const populated = await Event.findById(savedEvent._id)
      .populate("createdBy", "name email")
      .populate("group", "name")
      .populate("rsvp.user", "name email");

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: populated,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("createEvent error:", err);
    return sendError(
      res,
      500,
      "Internal server error while creating event.",
      err
    );
  }
};

// get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .populate("group", "name")
      .populate("rsvp.user", "name email")
      .populate("polls");
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("getAllEvents error:", err);
    return sendError(res, 500, "Internal server error fetching events.", err);
  }
};

// get events by id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("group", "name")
      .populate("rsvp.user", "name email")
      .populate("polls");
    if (!event) return sendError(res, 404, "Event not found.");
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    console.error("getEventById error:", err);
    return sendError(res, 500, "Internal server error fetching event.", err);
  }
};

// update events
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found.");

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "Unauthorized. Only event creator can update."
      );
    }

    // Apply allowed updates only (whitelist)
    const allowed = [
      "title",
      "description",
      "date",
      "time",
      "location",
      "capacity",
      "tags",
      "visibility",
      "isCancelled",
    ];
    allowed.forEach((key) => {
      if (key in req.body) {
        event[key] = req.body[key];
      }
    });

    // Save and return populated doc
    const saved = await event.save();
    const populated = await Event.findById(saved._id)
      .populate("createdBy", "name email")
      .populate("group", "name")
      .populate("rsvp.user", "name email");

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("updateEvent error:", err);
    return sendError(res, 400, "Failed to update event.", err);
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found.");

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "Unauthorized. Only event creator can delete."
      );
    }

    await event.remove();
    return res
      .status(200)
      .json({ success: true, message: "Event deleted successfully." });
  } catch (err) {
    console.error("deleteEvent error:", err);
    return sendError(res, 500, "Internal server error deleting event.", err);
  }
};

/**
 * Add or update RSVP
 */
export const addOrUpdateRSVP = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "going", "not_going", "maybe"].includes(status)) {
      return sendError(res, 400, "Invalid RSVP status.");
    }

    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found.");

    // Use instance method which returns saved doc
    const saved = await event.addOrUpdateRSVP(req.user._id, status);

    // reload/populate to return user info
    const populated = await Event.findById(saved._id)
      .populate("rsvp.user", "name email")
      .populate("createdBy", "name email")
      .populate("group", "name");

    return res.status(200).json({
      success: true,
      message: "RSVP updated successfully",
      data: populated,
    });
  } catch (err) {
    console.error("addOrUpdateRSVP error:", err);
    return sendError(res, 400, err.message || "Failed to update RSVP.");
  }
};

/**
 * Remove RSVP
 */
export const removeRSVP = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found.");

    const saved = await event.removeRSVP(req.user._id);
    const populated = await Event.findById(saved._id)
      .populate("rsvp.user", "name email")
      .populate("createdBy", "name email")
      .populate("group", "name");

    return res.status(200).json({
      success: true,
      message: "RSVP removed successfully",
      data: populated,
    });
  } catch (err) {
    console.error("removeRSVP error:", err);
    return sendError(res, 500, "Failed to remove RSVP.", err);
  }
};

/**
 * Cancel event
 */
export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 404, "Event not found.");

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Unauthorized. Only creator can cancel.");
    }

    event.isCancelled = true;
    const saved = await event.save();

    const populated = await Event.findById(saved._id)
      .populate("createdBy", "name email")
      .populate("group", "name");

    return res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: populated,
    });
  } catch (err) {
    console.error("cancelEvent error:", err);
    return sendError(res, 500, "Failed to cancel event.", err);
  }
};

/**
 * Public events and utility endpoints (unchanged)
 */
export const getPublicEvents = async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({
      isCancelled: false,
      date: { $gte: today },
      visibility: "public",
    })
      .populate("createdBy", "name email")
      .populate("group", "name");
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("getPublicEvents error:", err);
    return sendError(res, 500, "Internal server error", err);
  }
};

export const getNearbyEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng)
      return sendError(res, 400, "lat and lng are required as query params.");
    const events = await Event.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius, 10),
        },
      },
      isCancelled: false,
    });
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("getNearbyEvents error:", err);
    return sendError(res, 500, "Internal server error", err);
  }
};

export const getGroupEvents = async (req, res) => {
  try {
    const events = await Event.find({
      group: req.params.groupId,
      isCancelled: false,
    })
      .sort({ date: 1 })
      .populate("createdBy", "name email");
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error("getGroupEvents error:", err);
    return sendError(res, 500, "Internal server error", err);
  }
};
