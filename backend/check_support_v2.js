import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Temporary models to avoid import issues
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  isAdmin: Boolean,
  clerkId: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const supportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  status: String
});
const Support = mongoose.models.Support || mongoose.model('Support', supportSchema);

const checkDB = async () => {
  try {
    console.log('Connecting to MONGO_URI...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const issues = await Support.find().populate('user');
    console.log(`📊 Found ${issues.length} total support issues`);
    
    issues.forEach((i, index) => {
      console.log(`Issue ${index + 1}: [${i.status}] "${i.subject}" by ${i.user?.name || 'Unknown User'}`);
    });

    const admins = await User.find({ isAdmin: true });
    console.log(`👮 Found ${admins.length} admins:`);
    admins.forEach(a => {
      console.log(`- ${a.name} (${a.email}) clerkId: ${a.clerkId}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error('❌ Error checking DB:', err);
  }
};

checkDB();
