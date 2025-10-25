import Poll from "../models/Poll.js";

// createPoll
export const createPoll = async (req, res) => {
  try {
    const { title, description, options, relatedEvent, relatedGroup } =
      req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Title and at least 2 options are required.",
      });
    }

    const poll = await Poll.create({
      title,
      description,
      options: options.map((opt) => ({ text: opt })),
      createdBy: req.user._id,
      relatedEvent,
      relatedGroup,
    });

    res.status(201).json({ success: true, data: poll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// getPoll
export const getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate("createdBy", "name email")
      .populate("relatedEvent", "title date")
      .populate("relatedGroup", "name");
    res.status(200).json({ success: true, data: polls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// getPoll by id
export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("relatedEvent", "title date")
      .populate("relatedGroup", "name");

    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });

    res.status(200).json({ success: true, data: poll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// vote poll
export const votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });
    if (!poll.isActive)
      return res
        .status(400)
        .json({ success: false, message: "Poll is closed" });

    // Remove user from all option votes first (single vote)
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter(
        (v) => v.toString() !== req.user._id.toString()
      );
    });

    // Add vote to selected option
    const option = poll.options.id(optionId);
    if (!option)
      return res
        .status(404)
        .json({ success: false, message: "Option not found" });

    option.votes.push(req.user._id);
    await poll.save();

    res
      .status(200)
      .json({ success: true, message: "Vote cast successfully", data: poll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// delete poll
export const removeVote = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });

    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter(
        (v) => v.toString() !== req.user._id.toString()
      );
    });

    await poll.save();
    res
      .status(200)
      .json({ success: true, message: "Vote removed", data: poll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// close poll
export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });

    // Only creator can close
    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    poll.isActive = false;
    await poll.save();

    res
      .status(200)
      .json({ success: true, message: "Poll closed successfully", data: poll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
