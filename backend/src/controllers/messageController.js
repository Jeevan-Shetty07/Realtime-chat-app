import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

// @route   GET /api/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .populate("senderId", "_id name email avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, text, type } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }

    const msg = await Message.create({
      chatId,
      senderId: req.user._id,
      text,
      type: type || "text",
      seenBy: [req.user._id],
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });

    const populated = await Message.findById(msg._id).populate(
      "senderId",
      "_id name email avatar"
    );

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/messages/seen/:chatId
export const markAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      { chatId, seenBy: { $ne: req.user._id } },
      { $push: { seenBy: req.user._id } }
    );

    return res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
