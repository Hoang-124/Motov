import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../server/src/models/User.js';

dotenv.config({ path: path.join(process.cwd(), '../.env') });
dotenv.config();

async function testUpdate() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Motov';
    await mongoose.connect(mongoUri);
    
    const user = await User.findOne({ email: 'ht20041975@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current roles in database:', user.roles);
    user.roles = ['Owner'];
    
    try {
      await user.save();
      console.log('Save completed.');
    } catch (saveErr) {
      console.error('Save failed:', saveErr);
    }
    
    const updated = await User.findOne({ email: 'ht20041975@gmail.com' });
    console.log('After update roles:', updated.roles);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testUpdate();
