import Event from "../models/Event.js";

/**
 * @desc Create a new event
 * @route POST /api/events
 */
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      creator,
      group,
      date,
      time,
      location,
      capacity,
      tags,
      visibility,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      creator,
      group,
      date,
      time,
      location,
      capacity,
      tags,
      visibility,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all upcoming public events
 * @route GET /api/events
 */
export const getPublicEvents = async (req, res) => {
  try {
    const today = new Date();

    const events = await Event.find({
      isCancelled: false,
      date: { $gte: today },
      visibility: "public",
    })
      .populate("creator", "name email")
      .populate("group", "name");

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get events near a location
 * @route GET /api/events/nearby?lat=...&lng=...&radius=...
 */
export const getNearbyEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters

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

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc RSVP (attend) an event
 * @route POST /api/events/:id/rsvp
 */
export const rsvpEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (event.isCancelled)
      return res
        .status(400)
        .json({ success: false, message: "Event has been cancelled" });

    if (event.attendees.includes(userId))
      return res
        .status(400)
        .json({ success: false, message: "User already RSVP’d" });

    if (event.attendees.length >= event.capacity)
      return res
        .status(400)
        .json({ success: false, message: "Event is at full capacity" });

    event.attendees.push(userId);
    await event.save();

    res.status(200).json({ success: true, message: "RSVP successful", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Cancel an event (only creator)
 * @route PATCH /api/events/:id/cancel
 */
export const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (event.creator.toString() !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    event.isCancelled = true;
    await event.save();

    res
      .status(200)
      .json({ success: true, message: "Event cancelled successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all events for a specific group
 * @route GET /api/events/group/:groupId
 */
export const getGroupEvents = async (req, res) => {
  try {
    const { groupId } = req.params;
    const events = await Event.find({ group: groupId, isCancelled: false })
      .sort({ date: 1 })
      .populate("creator", "name email");

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
