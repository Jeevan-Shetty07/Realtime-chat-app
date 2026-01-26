import Chat from "../models/Chat.js";
import User from "../models/User.js";

// @route   GET /api/chats/users
// @desc    Get all users except logged in user (for search/start chat)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "_id name email avatar isOnline lastSeen"
    );

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/chats
// @desc    Create or get existing one-to-one chat
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    // Find existing chat between two users
    let chat = await Chat.findOne({
      members: { $all: [req.user._id, userId] },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).populate("members", "_id name email avatar isOnline lastSeen");

    if (chat) {
      return res.status(200).json(chat);
    }

    // Create new chat
    const newChat = await Chat.create({
      members: [req.user._id, userId],
      lastMessage: "",
      lastMessageAt: null,
    });

    chat = await Chat.findById(newChat._id).populate(
      "members",
      "_id name email avatar isOnline lastSeen"
    );

    return res.status(201).json(chat);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/chats
// @desc    Get all chats of logged in user
export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      members: { $in: [req.user._id] },
    })
      .populate("members", "_id name email avatar isOnline lastSeen")
      .sort({ updatedAt: -1 });

    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
