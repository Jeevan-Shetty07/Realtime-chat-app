import Support from "../models/Support.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

// @desc    Create a new support issue
// @route   POST /api/support
// @access  Private
export const createIssue = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Please provide subject and message" });
    }

    const issue = await Support.create({
      user: req.user._id,
      subject,
      message,
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all support issues
// @route   GET /api/support
// @access  Private/Admin
export const getAllIssues = async (req, res) => {
  console.log("👉 GET /api/support ENTERED by user:", req.user?.email, "isAdmin:", req.user?.isAdmin);
  try {
    const issues = await Support.find()
      .populate("user", "name email username avatar")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${issues.length} issues in DB`);
    res.status(200).json(issues);
  } catch (error) {
    console.error("❌ ERROR in getAllIssues:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update support issue status or add response
// @route   PATCH /api/support/:id
// @access  Private/Admin
export const updateIssue = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const issue = await Support.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (status !== undefined) {
      const oldStatus = issue.status;
      issue.status = status;
      
      // Notify user if status changed
      if (oldStatus !== status) {
        // 1. Find or create 1-on-1 chat
        let chat = await Chat.findOne({
          members: { $all: [req.user._id, issue.user] },
          isGroupChat: false,
        });

        if (!chat) {
          chat = await Chat.create({
            members: [req.user._id, issue.user],
            isGroupChat: false,
          });
        }

        const statusMsg = `Your support issue "${issue.subject}" is now marked as ${status.toUpperCase().replace("-", " ")}.`;

        // 2. Create the notification message
        const message = await Message.create({
          chatId: chat._id,
          senderId: req.user._id,
          text: statusMsg,
          isSupportResponse: true,
          seenBy: [req.user._id],
        });

        // 3. Update chat preview
        await Chat.findByIdAndUpdate(chat._id, {
          lastMessage: `[Support]: ${statusMsg.substring(0, 50)}`,
          lastMessageAt: new Date(),
          $set: { hiddenBy: [] }
        });

        // 4. Emit socket event
        const io = req.app.get("socketio");
        if (io) {
          const populatedMsg = await Message.findById(message._id)
            .populate("senderId", "_id name avatar username")
            .lean();

          [req.user._id, issue.user].forEach(userId => {
            io.to(`user_${userId.toString()}`).emit("receiveMessage", {
              chatId: chat._id,
              message: populatedMsg,
            });
          });
        }
      }
    }
    
    // Create a chat message if there's a new admin response
    if (adminResponse !== undefined && adminResponse.trim() !== "") {
      issue.adminResponse = adminResponse;
      
      // 1. Find or create 1-on-1 chat
      let chat = await Chat.findOne({
        members: { $all: [req.user._id, issue.user] },
        isGroupChat: false,
      });

      if (!chat) {
        chat = await Chat.create({
          members: [req.user._id, issue.user],
          isGroupChat: false,
        });
      }

      // 2. Create the support message
      const message = await Message.create({
        chatId: chat._id,
        senderId: req.user._id,
        text: adminResponse,
        isSupportResponse: true,
        seenBy: [req.user._id],
      });

      // 3. Update chat preview
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: `[Support]: ${adminResponse.substring(0, 50)}`,
        lastMessageAt: new Date(),
        $set: { hiddenBy: [] }
      });

      // 4. Emit socket event
      const io = req.app.get("socketio");
      if (io) {
        const populatedMsg = await Message.findById(message._id)
          .populate("senderId", "_id name avatar username")
          .lean();

        [req.user._id, issue.user].forEach(userId => {
          io.to(`user_${userId.toString()}`).emit("receiveMessage", {
            chatId: chat._id,
            message: populatedMsg,
          });
        });
      }
    } else if (adminResponse !== undefined) {
      issue.adminResponse = adminResponse; // Allow clearing if empty
    }

    const updatedIssue = await issue.save();
    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's support issues
// @route   GET /api/support/my-issues
// @access  Private
export const getMyIssues = async (req, res) => {
  try {
    const issues = await Support.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
