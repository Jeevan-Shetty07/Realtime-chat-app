import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function test() {
    try {
        console.log("Type of verifyToken:", typeof clerkClient.verifyToken);
        console.log("verifyToken details:", clerkClient.verifyToken.toString().substring(0, 100));
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
