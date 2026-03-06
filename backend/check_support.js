import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Support from './src/models/Support.js';
import User from './src/models/User.js';

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const issues = await Support.find().populate('user');
    console.log(`Found ${issues.length} support issues`);
    
    const allUsers = await User.find();
    console.log(`Found ${allUsers.length} total users:`);
    allUsers.forEach(u => {
      console.log(`- ${u.name} (${u.email}) | clerkId: ${u.clerkId} | isAdmin: ${u.isAdmin} | ID: ${u._id}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error checking DB:', err);
  }
};

checkDB();
