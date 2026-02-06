import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ name: /jeevitha/i });
        if (!user) {
            console.log("User not found!");
            return;
        }
        console.log("Found user:", user.name, "current username:", user.username);

        const newUsername = "jeevitha_" + Math.floor(Math.random() * 1000);
        console.log("Attempting to set username to:", newUsername);
        
        user.username = newUsername;
        const updated = await user.save();
        console.log("✅ Update successful! New username:", updated.username);

        // Reset
        user.username = null;
        await user.save();
        console.log("Reset back to null.");
        
    } catch (err) {
        console.error("❌ UPDATE FAILED:", err);
        if (err.name === 'ValidationError') {
            console.error("Details:", err.errors);
        }
    } finally {
        await mongoose.disconnect();
    }
}

test();
