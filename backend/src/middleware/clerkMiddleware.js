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
    try {
      const parts = token.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log("🎫 JWT Header:", header);
      console.log("📄 JWT Payload:", payload);
    } catch (e) {
      console.log("⚠️ Could not parse JWT as JSON:", e.message);
    }

    // Unified Protection Logic
    let decoded;
    let userId;
    let isClerk = false;

    // First, try verifying as a Clerk token
    try {
      console.log("🎟️ Attempting Clerk token verification...");
      
      // Determine if CLERK_JWT_KEY is a Publishable Key (starts with pk_) 
      // or an actual Public Key (usually starts with 'ssh-rsa', '-----BEGIN PUBLIC KEY-----', or is long base64).
      // If it's a Publishable Key, we should NOT pass it as jwtKey, as clerkClient.verifyToken
      // expects a PEM or base64 encoded string of the Public Key, not the Publishable Key.
      const rawJwtKey = process.env.CLERK_JWT_KEY;
      const isPublishableKey = rawJwtKey && (rawJwtKey.startsWith('pk_test_') || rawJwtKey.startsWith('pk_live_'));
      
      const verificationOptions = {};
      if (rawJwtKey && !isPublishableKey) {
        verificationOptions.jwtKey = rawJwtKey;
      }

      decoded = await clerkClient.verifyToken(token, verificationOptions);
      userId = decoded.sub;
      isClerk = true;
      console.log("✅ Clerk Token Verified for sub:", userId);
    } catch (clerkError) {
      console.log("ℹ️ Clerk verification failed:", clerkError.message);
      if (clerkError.stack) console.log("🔍 Clerk Error Stack:", clerkError.stack.split('\n')[0]);
      
      // If not a Clerk token, try verifying as a local JWT
      try {
        console.log("🎫 Attempting local JWT verification...");
        decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        userId = decoded.id;
        console.log("✅ Local JWT Verified for ID:", userId);
      } catch (jwtError) {
        console.error("❌ Token Verification Failed (Both Clerk and Local)");
        console.log("🔍 Local JWT Error:", jwtError.message);
        return res.status(401).json({ message: "Not authorized, token invalid" });
      }
    }

    let user;
    if (isClerk) {
      console.log("🔍 Searching for Clerk user in DB with ID:", userId);
      user = await User.findOne({ clerkId: userId });
      
      if (!user) {
        console.log("🔍 DB lookup by clerkId failed. Checking email in payload:", decoded.email);
        if (decoded.email) {
          user = await User.findOne({ email: decoded.email });
          if (user) {
            console.log("🔗 Linking existing user by email to Clerk ID");
            user.clerkId = userId;
            await user.save();
          }
        }
      }
    } else {
      // Local user
      console.log("🔍 Searching for local user in DB with ID:", userId);
      user = await User.findById(userId);
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
