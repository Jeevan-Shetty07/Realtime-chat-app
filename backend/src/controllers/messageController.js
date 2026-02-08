import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import fs from "fs";


// @route   GET /api/messages/:chatId
// @desc    Get messages for a chat with pagination
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const messages = await Message.find({ chatId })
      .populate("senderId", "_id name email avatar")
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Optimize performance

    return res.status(200).json(messages);
  } catch (error) {
    console.error("🔥 GET MESSAGES ERROR:", error);
    return res.status(500).json({ message: "Error fetching messages" });
  }
};

// @route   POST /api/messages
// @desc    Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, text, type, attachments } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatId).populate("members", "_id blockedUsers");
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Blocking Check (for 1-on-1 chats)
    if (!chat.isGroupChat) {
      const sender = chat.members.find(m => m._id.toString() === req.user._id.toString());
      const recipient = chat.members.find(m => m._id.toString() !== req.user._id.toString());

      if (sender?.blockedUsers?.some(bid => bid.toString() === recipient?._id?.toString())) {
        return res.status(403).json({ message: "You have blocked this user" });
      }
      if (recipient?.blockedUsers?.some(bid => bid.toString() === sender?._id?.toString())) {
        return res.status(403).json({ message: "You are blocked by this user" });
      }
    }

    const textTrimmed = text ? text.trim() : "";
    
    if (!textTrimmed && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message must have text or attachments" });
    }

    // Validate text length
    if (textTrimmed && textTrimmed.length > 5000) {
      return res.status(400).json({ message: "Message cannot exceed 5000 characters" });
    }

    // Validate message type
    const validTypes = ["text", "image", "video", "file"];
    const messageType = type || "text";
    if (!validTypes.includes(messageType)) {
      return res.status(400).json({ message: "Invalid message type" });
    }

    // Create message - only include attachments if array is not empty
    const messageData = {
      chatId,
      senderId: req.user._id,
      text: textTrimmed,
      type: messageType,
      seenBy: [req.user._id],
    };
    
    // Only add attachments if there are any
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }
    
    console.log("📝 Attempting to create message with data:", JSON.stringify(messageData, null, 2));

    let msg;
    try {
      msg = await Message.create(messageData);
      console.log("✅ Message created successfully:", msg._id);
    } catch (createError) {
      console.error("🔥 Message.create failed:", createError);
      fs.appendFileSync("backend_errors.log", `${new Date().toISOString()} - Message Create Error: ${createError.stack}\n`);
      throw createError;
    }


    // Update last message in chat
    let lastMsgText = textTrimmed;
    if (!textTrimmed && attachments?.length > 0) {
      lastMsgText = messageType === 'image' ? '📷 Image' : '📎 Attachment';
    }

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: lastMsgText.substring(0, 100), // Limit preview length
      lastMessageAt: new Date(),
    });

    // Populate sender info
    const populated = await Message.findById(msg._id)
      .populate("senderId", "_id name email avatar")
      .lean();

    // Real-time synchronization using Personal Rooms
    const io = req.app.get("socketio");
    if (io && chat.members) {
      chat.members.forEach((member) => {
        const memberId = member._id.toString();
        // Skip sender if you want (frontend handles local state), 
        // but sending to all ensures sidebars update everywhere
        io.to(`user_${memberId}`).emit("receiveMessage", {
          chatId,
          message: populated,
        });
      });
      console.log(`📡 Message ${populated._id} broadcasted to ${chat.members.length} personal rooms`);
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error("🔥 SEND MESSAGE ERROR:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    
    return res.status(500).json({ message: "Error sending message" });
  }
};

// @route   PUT /api/messages/seen/:chatId
// @desc    Mark all messages in a chat as seen
export const markAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    // Update all messages in the chat that haven't been seen by this user
    const result = await Message.updateMany(
      { chatId, seenBy: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );

    return res.status(200).json({ 
      message: "Messages marked as seen",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("🔥 MARK AS SEEN ERROR:", error);
    return res.status(500).json({ message: "Error marking messages as seen" });
  }
};

// @route   PUT /api/messages/reaction/:messageId
// @desc    Add or remove a reaction to a message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with THIS emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Toggle off (remove reaction if already exists)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      // Optional: Limit to one reaction per user? Or allow multiple? 
      // Most apps allow 1 per user, or multiple. Let's allow multiple distinct emojis.
       message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    return res.status(200).json(message);
  } catch (error) {
    console.error("🔥 ADD REACTION ERROR:", error);
    return res.status(500).json({ message: "Error adding reaction" });
  }
};

// @route   DELETE /api/messages/:chatId/clear
// @desc    Delete all messages in a chat
export const clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    // Delete all messages
    await Message.deleteMany({ chatId });

    // Update last message in chat to reflect cleared state
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: "Chat cleared",
      lastMessageAt: new Date(),
    });

    return res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.error("🔥 CLEAR CHAT ERROR:", error);
    return res.status(500).json({ message: "Error clearing chat" });
  }
};
