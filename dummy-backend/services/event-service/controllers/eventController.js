import Event from "../models/Event.js";

// create event
export const createEvent = async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      createdBy: req.user._id, // auth middleware must set req.user
    });
    await event.save();
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// getevent by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("group", "name")
      .populate("rsvp.user", "name email")
      .populate("polls");
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update events
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (event.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });

    Object.assign(event, req.body);
    await event.save();
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// delete events
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (event.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });

    await event.remove();
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// add or update RSVP
export const addOrUpdateRSVP = async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    await event.addOrUpdateRSVP(req.user._id, status);
    res.status(200).json({
      success: true,
      message: "RSVP updated successfully",
      data: event,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// removeRSVP
export const removeRSVP = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    await event.removeRSVP(req.user._id);
    res.status(200).json({
      success: true,
      message: "RSVP removed successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// cancelEvent
export const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (event.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });

    event.isCancelled = true;
    await event.save();
    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// getPublicEvents
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
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get nearby events
export const getNearbyEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    const events = await Event.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      },
      isCancelled: false,
    });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get group events
export const getGroupEvents = async (req, res) => {
  try {
    const events = await Event.find({
      group: req.params.groupId,
      isCancelled: false,
    })
      .sort({ date: 1 })
      .populate("createdBy", "name email");
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
