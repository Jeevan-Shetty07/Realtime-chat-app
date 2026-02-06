import { createClerkClient } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";

console.log("🔑 clerkMiddleware INITIALIZED. Key present:", !!process.env.CLERK_SECRET_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const clerkProtect = async (req, res, next) => {
  console.log("👉 clerkProtect ENTERED:", req.method, req.url);
  console.log("🔍 Type of next:", typeof next);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
        decoded = await clerkClient.verifyToken(token);
        console.log("🎟️ Token Decoded:", JSON.stringify(decoded).substring(0, 100));
    } catch (jwtError) {
        console.error("❌ JWT Verification Failed:", jwtError.message);
        return res.status(401).json({ message: "Not authorized, token invalid", reason: jwtError.message });
    }

    const clerkId = decoded.sub;
    console.log("🔍 Clerk ID:", clerkId);

    let user = await User.findOne({ clerkId });
    
    if (!user) {
      console.log("🔍 User not in DB, fetching from Clerk...");
      try {
        console.log("🛠️ FETCHING FROM CLERK FOR ID:", clerkId);
        const users = await clerkClient.users.getUserList({ userId: [clerkId] });
        const clerkUser = users[0];

        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.clerkId = clerkId;
              await user.save();
            } else {
              const userObj = {
                clerkId,
                email,
                name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
                avatar: clerkUser.imageUrl || "",
              };
              
              if (clerkUser.username) {
                userObj.username = clerkUser.username;
              }

              user = await User.create(userObj);
              console.log("✨ New user created in DB:", user.clerkId);
            }
          }
        } else {
          console.log("❌ Clerk user not found for ID:", clerkId);
        }
      } catch (clerkError) {
        console.error("❌ Error fetching from Clerk (FULL):", clerkError);
      }
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
      // If next is missing but this is used as middleware, we have a routing issue
      // We can try to manually return the next handler if we knew it, but better to fail gracefully
      res.status(500).json({ message: "Internal Server Error: Middleware flow broken" });
    }
  } catch (error) {
    console.error("🔥 CLERK PROTECT SYSTEM ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
