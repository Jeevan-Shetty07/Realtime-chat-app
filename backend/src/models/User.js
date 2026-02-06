import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true, 
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address"
      ]
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined for existing users initially
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
    },
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: { 
      type: String, 
      required: false, 
      minlength: [6, "Password must be at least 6 characters"], 
      select: false 
    },
    avatar: { 
      type: String, 
      default: "" 
    },
    about: { 
      type: String, 
      default: "Hey there! I am using Chat App.",
      maxlength: [150, "About cannot exceed 150 characters"]
    },
    isOnline: { 
      type: Boolean, 
      default: false 
    },
    lastSeen: { 
      type: Date, 
      default: null 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Virtual for user's full profile (excluding sensitive data)
userSchema.virtual("profile").get(function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    about: this.about,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt
  };
});

const User = mongoose.model("User", userSchema);

export default User;

