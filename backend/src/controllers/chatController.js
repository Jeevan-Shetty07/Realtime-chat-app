import Chat from "../models/Chat.js";
import User from "../models/User.js";

// @route   GET /api/chats/users
// @desc    Get all users except logged in user (for search/start chat)
export const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build query
    const query = { _id: { $ne: req.user._id } };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("_id name email avatar isOnline lastSeen")
      .limit(50) // Limit results for performance
      .lean(); // Optimize query performance

    return res.status(200).json(users);
  } catch (error) {
    console.error("🔥 GET USERS ERROR:", error);
    return res.status(500).json({ message: "Error fetching users" });
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
    const { page = 1, limit = 50 } = req.query;
    
    const chats = await Chat.find({
      members: { $in: [req.user._id] },
    })
      .populate("members", "_id name email avatar isOnline lastSeen")
      .populate("groupAdmin", "_id name")
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    return res.status(200).json(chats);
  } catch (error) {
    console.error("🔥 GET MY CHATS ERROR:", error);
    return res.status(500).json({ message: "Error fetching chats" });
  }
};

// @route   POST /api/chats/group
// @desc    Create a new group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    // Validation
    if (!name || !users) {
      return res.status(400).json({ message: "Name and users are required" });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({ message: "Group name cannot be empty" });
    }

    if (name.length > 100) {
      return res.status(400).json({ message: "Group name cannot exceed 100 characters" });
    }

    // Parse users array
    let usersParsed = users;
    if (typeof users === "string") {
      try {
        usersParsed = JSON.parse(users);
      } catch (e) {
        return res.status(400).json({ message: "Invalid users format" });
      }
    }

    if (!Array.isArray(usersParsed)) {
      return res.status(400).json({ message: "Users must be an array" });
    }

    if (usersParsed.length < 2) {
      return res
        .status(400)
        .json({ message: "Group chat requires at least 2 users (plus you)" });
    }

    // Add current user to group
    usersParsed.push(req.user._id.toString());

    // Remove duplicates
    usersParsed = [...new Set(usersParsed)];

    const groupChat = await Chat.create({
      chatName: name.trim(),
      members: usersParsed,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("members", "_id name email avatar")
      .populate("groupAdmin", "_id name email");

    return res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error("🔥 CREATE GROUP ERROR:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    
    return res.status(500).json({ message: "Error creating group chat" });
  }
};

// @route   PUT /api/chats/group/rename
// @desc    Rename a group chat
export const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.json(updatedChat);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/chats/group/add
// @desc    Add user to group
export const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.json(added);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/chats/group/remove
// @desc    Remove user from group
export const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.json(removed);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
