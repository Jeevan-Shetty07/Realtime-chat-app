import User from "../models/User.js";

// @route   GET /api/auth/me
// @desc    Get logged-in user profile
export const getMe = async (req, res) => {
  try {
    // req.user is set by clerkMiddleware
    if (!req.user) {
      console.log("❌ getMe: req.user is null");
      return res.status(401).json({ message: "Not authorized" });
    }
    console.log("✅ getMe: Found user:", req.user.name, "Username:", req.user.username);

    return res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        about: req.user.about,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("🔥 GET ME ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
