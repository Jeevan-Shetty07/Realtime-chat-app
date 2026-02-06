import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function test() {
    try {
        console.log("Testing Clerk Secret Key...");
        const users = await clerkClient.users.getUserList({ limit: 1 });
        console.log("✅ Secret Key is VALID! Found users:", users.length);
    } catch (err) {
        console.error("❌ Secret Key is INVALID or Connectivity Error:", err.message);
    }
}

test();
