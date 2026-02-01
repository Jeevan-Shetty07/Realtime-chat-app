import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
const isStrongPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

// @route   POST /api/auth/register
// @desc    Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    // Comprehensive input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required",
        fields: { name: !name, email: !email, password: !password }
      });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ message: "Name cannot exceed 50 characters" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      avatar: avatar || "",
    });

    // Generate JWT token with 30 days expiry
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        about: user.about,
      },
      token,
    });
  } catch (error) {
    console.error("🔥 REGISTER ERROR:", error);
    
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required",
        fields: { email: !email, password: !password }
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      // Generic error message for security (don't reveal if email exists)
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        about: user.about,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
      token,
    });
  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// @route   GET /api/auth/me
// @desc    Get logged-in user profile
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    return res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
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
