import express from "express";
import { unifiedProtect } from "../middleware/clerkMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// @route   GET /api/users/check-username
// @desc    Check if username is available and get suggestions
router.get("/check-username", unifiedProtect, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "Username is required" });

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    if (!existingUser) {
      return res.status(200).json({ available: true });
    }

    // Generate suggestions
    const suggestions = [];
    let i = 1;
    while (suggestions.length < 3) {
      const candidate = `${username}${Math.floor(Math.random() * 1000)}`.toLowerCase();
      const isTaken = await User.findOne({ username: candidate });
      if (!isTaken && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
      if (i > 10) break; // Safety break
      i++;
    }

    res.status(200).json({ available: false, suggestions });
  } catch (error) {
    res.status(500).json({ message: "Error checking username" });
  }
});

router.put("/profile", unifiedProtect, async (req, res) => {
  try {
    const { name, about, avatar, username } = req.body;
    console.log("👤 Updating profile for user ID:", req.user._id, "New username:", username);

    const user = await User.findById(req.user._id);

    if (user) {
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        user.username = username;
      }

      user.name = name || user.name;
      user.about = about || user.about;
      user.avatar = avatar || user.avatar;

      const updatedUser = await user.save();

      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          about: updatedUser.about,
          isOnline: updatedUser.isOnline,
          lastSeen: updatedUser.lastSeen,
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("🔥 UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

// @route   POST /api/users/block
// @desc    Block a user
router.post("/block", unifiedProtect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
      
      // Real-time synchronization
      const io = req.app.get("socketio");
      if (io) {
        console.log(`📡 Emitting userBlocked to ${userId} from ${req.user._id}`);
        io.emit("userBlocked", { blockedBy: req.user._id, blockedUser: userId });
      }
    }

    res.status(200).json({ message: "User blocked successfully", blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error blocking user" });
  }
});

// @route   POST /api/users/unblock
// @desc    Unblock a user
router.post("/unblock", unifiedProtect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();

    // Real-time synchronization
    const io = req.app.get("socketio");
    if (io) {
      console.log(`📡 Emitting userUnblocked to ${userId} from ${req.user._id}`);
      io.emit("userUnblocked", { unblockedBy: req.user._id, unblockedUser: userId });
    }

    res.status(200).json({ message: "User unblocked successfully", blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking user" });
  }
});

// @route   GET /api/users/blocked
// @desc    Get blocked users list
router.get("/blocked", unifiedProtect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("blockedUsers", "_id name email avatar username");
    res.status(200).json(user.blockedUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blocked users" });
  }
});

export default router;
