import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function test() {
    try {
        console.log("Testing getUserList...");
        // Use a dummy ID or just a list
        const users = await clerkClient.users.getUserList({ limit: 1 });
        console.log("✅ getUserList works! Found users:", users.length);
        if (users.length > 0) {
            const id = users[0].id;
            console.log("Testing getUser with ID:", id);
            const user = await clerkClient.users.getUser(id);
            console.log("✅ getUser works! User:", user.id);
        }
    } catch (err) {
        console.error("❌ Test failed:", err);
    }
}

test();
