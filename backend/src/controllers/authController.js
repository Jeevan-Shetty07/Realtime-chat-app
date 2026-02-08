import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

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
        isAdmin: req.user.isAdmin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("🔥 GET ME ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password, // User model has a pre-save hook to hash this
    });

    if (user) {
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("🔥 REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate a user & get token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          username: user.username,
          isAdmin: user.isAdmin,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   DELETE /api/auth/me
// @desc    Delete logged-in user account
export const deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // You might want to delete messages and chats as well, 
    // but for now we'll just delete the user record.
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("🔥 DELETE ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- ADMIN CONTROLLERS ---

// @route   GET /api/auth/admin/users
// @desc    Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("🔥 GET ALL USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   DELETE /api/auth/admin/users/:id
// @desc    Delete any user (Admin only)
export const adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("🔥 ADMIN DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/auth/admin/users/:id/role
// @desc    Toggle user admin status (Admin only)
export const toggleAdminStatus = async (req, res) => {
  try {
    const MAIN_ADMIN_EMAIL = "jeevanshetty9481@gmail.com";

    // 1. Only the Main Admin can promote/demote others
    if (req.user.email !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ 
        message: "Access Denied: Only the Main Admin can manage administrative roles." 
      });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: "User not found" });

    // 2. Prevent demoting the Main Admin (even if they try to demote themselves)
    if (userToUpdate.email === MAIN_ADMIN_EMAIL && userToUpdate.isAdmin) {
         return res.status(403).json({ 
            message: "Action Forbidden: The Main Admin account cannot be demoted." 
         });
    }

    userToUpdate.isAdmin = !userToUpdate.isAdmin;
    await userToUpdate.save();
    
    res.json({ message: `User admin status set to ${userToUpdate.isAdmin}`, user: userToUpdate });
  } catch (error) {
    console.error("🔥 TOGGLE ADMIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
