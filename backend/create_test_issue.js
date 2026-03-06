import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Support from './src/models/Support.js';
import User from './src/models/User.js';

dotenv.config();

const createTestIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      console.error('No admin found to associate issue with');
      process.exit(1);
    }

    const issue = await Support.create({
      user: admin._id,
      subject: 'Manual Test Issue',
      message: 'This issue was created via script to test visibility.',
      status: 'pending'
    });

    console.log('Test issue created:', issue._id);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error creating issue:', err);
  }
};

createTestIssue();
