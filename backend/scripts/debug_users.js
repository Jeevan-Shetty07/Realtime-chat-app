import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 1. List Users
    const users = await User.find({});
    console.log(`\n📊 Total Users: ${users.length}`);
    users.forEach(u => console.log(` - ${u.name} (username: ${u.username || "NOT SET"})`));

    // 2. Create Dummy User if needed
    const dummyName = "Alice Wonderland";
    let dummy = await User.findOne({ email: "alice@example.com" });
    
    if (!dummy) {
      console.log("\n👤 Creating dummy user 'Alice'...");
      dummy = await User.create({
        name: dummyName,
        email: "alice@example.com",
        username: "alice_wonder",
        password: "password123",
        isOnline: true
      });
      console.log("✅ Dummy user created.");
    } else {
      console.log("\nℹ️ Dummy user 'Alice' already exists.");
    }

    // 3. Clear current user username to test modal
    // Assuming the user logged in is NOT Alice. We'll pick the first user that isn't Alice.
    const myUser = await User.findOne({ email: { $ne: "alice@example.com" } });
    
    if (myUser) {
        console.log(`\n🔧 Target User for Reset: ${myUser.name} (${myUser.email})`);
        // Force unset username
        myUser.username = undefined; 
        await myUser.save();
        
        // Mongoose might not unset it if schema default is different or if it was just null
        // Let's explicitly use updateOne to be sure
        await User.updateOne({ _id: myUser._id }, { $unset: { username: 1 } });
        
        console.log("✅ Username CLEARED for testing modal.");
    } else {
        console.log("⚠️ No other user found to reset.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

run();
