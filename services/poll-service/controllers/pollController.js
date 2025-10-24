import Poll from "../models/Poll.js";

/**
 * @desc Create a new poll
 * @route POST /api/polls
 */
export const createPoll = async (req, res) => {
  try {
    const { title, description, creator, group, options, expiresAt } = req.body;

    if (!options || options.length < 2)
      return res
        .status(400)
        .json({ success: false, message: "At least 2 options required" });

    const poll = await Poll.create({
      title,
      description,
      creator,
      group,
      options: options.map((text) => ({ text })),
      expiresAt,
    });

    res.status(201).json({ success: true, message: "Poll created", poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all active polls for a group
 * @route GET /api/polls/group/:groupId
 */
export const getGroupPolls = async (req, res) => {
  try {
    const { groupId } = req.params;
    const polls = await Poll.find({ group: groupId, isActive: true }).populate(
      "creator",
      "name email"
    );
    res.status(200).json({ success: true, polls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Vote on a poll option
 * @route POST /api/polls/:pollId/vote
 */
export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId, optionIndex } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });
    if (!poll.isActive)
      return res
        .status(400)
        .json({ success: false, message: "Poll is closed" });

    // Check if user already voted
    const alreadyVoted = poll.options.some((opt) => opt.votes.includes(userId));
    if (alreadyVoted)
      return res.status(400).json({ success: false, message: "Already voted" });

    // Record vote
    if (!poll.options[optionIndex])
      return res
        .status(400)
        .json({ success: false, message: "Invalid option" });

    poll.options[optionIndex].votes.push(userId);
    await poll.save();

    res.status(200).json({ success: true, message: "Vote recorded", poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Close a poll (only creator)
 * @route PATCH /api/polls/:pollId/close
 */
export const closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });

    if (poll.creator.toString() !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    poll.isActive = false;
    await poll.save();

    res.status(200).json({ success: true, message: "Poll closed", poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
