import { createClerkClient } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

console.log("🔑 clerkMiddleware INITIALIZED. Key present:", !!process.env.CLERK_SECRET_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const unifiedProtect = async (req, res, next) => {
  console.log("👉 unifiedProtect ENTERED:", req.method, req.url);
  console.log("🔍 Type of next:", typeof next);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Unified Protection Logic
    let decoded;
    let userId;
    let isClerk = false;

    // First, try verifying as a Clerk token
    try {
      decoded = await clerkClient.verifyToken(token);
      userId = decoded.sub;
      isClerk = true;
      console.log("🎟️ Clerk Token Decoded for ID:", userId);
    } catch (clerkError) {
      console.log("ℹ️ Not a Clerk token, trying local JWT...");
      // If not a Clerk token, try verifying as a local JWT
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        userId = decoded.id;
        console.log("🎫 Local JWT Decoded for ID:", userId);
      } catch (jwtError) {
        console.error("❌ Token Verification Failed (Both Clerk and Local):", jwtError.message);
        return res.status(401).json({ message: "Not authorized, token invalid" });
      }
    }

    let user;
    if (isClerk) {
      user = await User.findOne({ clerkId: userId });
      
      if (!user) {
        console.log("🔍 DB lookup by clerkId failed. Syncing from Clerk metadata...");
        try {
          const clerkUsers = await clerkClient.users.getUserList({ userId: [userId] });
          const clerkUser = clerkUsers[0];

          if (clerkUser) {
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            console.log("📧 Clerk user email found:", email);
            
            if (email) {
              // Try finding by email if clerkId lookup failed (to link accounts)
              user = await User.findOne({ email });
              if (user) {
                console.log("🔗 Found existing user by email. Linking to Clerk ID...");
                user.clerkId = userId;
                // Copy avatar if missing
                if (!user.avatar && clerkUser.imageUrl) {
                    user.avatar = clerkUser.imageUrl;
                }
                await user.save();
              } else {
                console.log("🆕 No user found by email. Creating new DB record...");
                const userObj = {
                  clerkId: userId,
                  email,
                  name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
                  avatar: clerkUser.imageUrl || "",
                };
                if (clerkUser.username) userObj.username = clerkUser.username;
                user = await User.create(userObj);
                console.log("✨ New user created in DB:", user._id);
              }
            } else {
              console.log("⚠️ No email found for Clerk user!");
            }
          } else {
            console.log("⚠️ Clerk getUserList returned no user for ID:", userId);
          }
        } catch (error) {
          console.error("❌ Error syncing from Clerk:", error);
        }
      } else {
        console.log("✅ User found in DB by clerkId:", user.username || user.name);
      }
    } else {
      // Local user
      user = await User.findById(userId);
      if (!user) console.log("⚠️ Local user not found in DB for ID:", userId);
    }

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    console.log("✅ Auth Success for:", user.username || user.name);

    if (typeof next === "function") {
      next();
    } else {
      console.error("❌ CRITICAL: next is not a function!");
      res.status(500).json({ message: "Internal Server Error: Middleware flow broken" });
    }
  } catch (error) {
    console.error("🔥 UNIFIED PROTECT SYSTEM ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const adminProtect = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};
