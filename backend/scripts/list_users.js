import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log("Found users:", users.length);
        users.forEach(u => {
            console.log(`- ID: ${u._id}, Name: ${u.name}, Username: ${u.username}, ClerkID: ${u.clerkId}`);
        });
    } catch (err) {
        console.error("❌ DB Query failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
