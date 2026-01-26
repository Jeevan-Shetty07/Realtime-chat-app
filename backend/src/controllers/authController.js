import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// @route   POST /api/auth/register
// @desc    Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      avatar: avatar || "",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
      console.log("🔥 REGISTER ERROR FULL:", error);
  return res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/auth/me
// @desc    Get logged-in user profile
export const getMe = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
