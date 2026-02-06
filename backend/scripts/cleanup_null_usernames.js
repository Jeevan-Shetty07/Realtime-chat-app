import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";
dotenv.config();

async function clean() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Cleaning up null usernames...");
        // In MongoDB, to remove a field we set it to undefined in Mongoose or use $unset
        const result = await User.updateMany(
            { username: null },
            { $unset: { username: "" } }
        );
        console.log(`✅ Cleanup done. Modified ${result.modifiedCount} documents.`);
    } catch (err) {
        console.error("❌ Cleanup failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

clean();
