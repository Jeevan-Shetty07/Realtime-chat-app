import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

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
      .select("_id name email avatar isOnline lastSeen isAdmin")
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
    console.log("🔎 accessChat payload:", { userId, requester: req.user?._id });

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    // Double check: ensure members array is exactly the pair [requester, userId]
    const sortedMembers = [req.user._id, userId].sort();

    // Find existing chat between two users
    let chat = await Chat.findOne({
      members: { $all: [req.user._id, userId] },
      isGroupChat: false,
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).populate("members", "_id name email avatar isOnline lastSeen username about isAdmin blockedUsers");

    if (chat) {
      console.log("✅ accessChat: Found existing chat", chat._id);
      return res.status(200).json(chat);
    }

    // Create new chat - wrapping in a try-catch for potential race conditions if indexes aren't perfect
    try {
        console.log("🆕 accessChat: Creating new chat for pair", sortedMembers);
        const newChat = await Chat.create({
          members: [req.user._id, userId],
          lastMessage: "",
          lastMessageAt: null,
          isGroupChat: false
        });

        chat = await Chat.findById(newChat._id).populate(
          "members",
          "_id name email avatar isOnline lastSeen username about isAdmin"
        );

        return res.status(201).json(chat);
    } catch (createError) {
        // If creation failed (likely due to a concurrent request that created it first), try finding it one last time
        console.warn("⚠️ accessChat: Creation conflict, searching again...");
        chat = await Chat.findOne({
            members: { $all: [req.user._id, userId] },
            isGroupChat: false,
            $expr: { $eq: [{ $size: "$members" }, 2] },
        }).populate("members", "_id name email avatar isOnline lastSeen username about isAdmin blockedUsers");

        if (chat) return res.status(200).json(chat);
        throw createError;
    }
  } catch (error) {
    console.error("🔥 ACCESS CHAT ERROR:", error);
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
      .populate("members", "_id name email avatar isOnline lastSeen username about isAdmin blockedUsers")
      .populate("groupAdmins", "_id name")
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calculate unread counts for each chat
    const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                senderId: { $ne: req.user._id }, // Don't count own messages
                seenBy: { $ne: req.user._id }
            });
            
            // Convert to plain object and add unreadCount
            const chatObj = chat.toObject();
            chatObj.unreadCount = unreadCount;
            return chatObj;
        })
    );

    return res.status(200).json(chatsWithUnread);
  } catch (error) {
    console.error("🔥 GET MY CHATS ERROR:", error);
    return res.status(500).json({ message: "Error fetching chats" });
  }
};

// @route   POST /api/chats/group
// @desc    Create a new group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name, users, groupImage } = req.body;

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
      groupAdmins: [req.user._id],
      groupImage: groupImage || ""
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("members", "_id name email avatar username about isAdmin")
      .populate("groupAdmins", "_id name email");

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
      .populate("groupAdmins", "-password");

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
      .populate("groupAdmins", "-password");

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
      .populate("groupAdmins", "-password");

    if (!removed) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.json(removed);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
