import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        console.log("Attempting to create user...");
        const user = await User.create({
            name: "Test User",
            email: "test-" + Date.now() + "@example.com",
            clerkId: "test-" + Date.now()
        });
        console.log("✅ User created successfully:", user._id);
        
        await User.deleteOne({ _id: user._id });
        console.log("Cleanup done.");
    } catch (err) {
        console.error("❌ REPLICATION FAILED:", err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
