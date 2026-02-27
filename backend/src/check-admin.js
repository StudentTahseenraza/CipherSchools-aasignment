import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './models/mongodb/User.model.js';

dotenv.config();

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('\n📋 Admin User Details:');
    console.log('ID:', adminUser._id);
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('isAdmin:', adminUser.isAdmin);
    console.log('Created:', adminUser.createdAt);
    
    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await adminUser.comparePassword(testPassword);
    console.log('\n🔑 Password Test:');
    console.log('Password "admin123" matches:', isMatch);
    
    if (!isMatch) {
      // Reset password if it doesn't match
      console.log('\n🔄 Resetting admin password...');
      adminUser.passwordHash = 'admin123';
      await adminUser.save();
      console.log('✅ Password reset complete');
      
      // Test again
      const newMatch = await adminUser.comparePassword('admin123');
      console.log('New password matches:', newMatch);
    }

    // Update isAdmin flag if needed
    if (!adminUser.isAdmin) {
      console.log('\n🔄 Setting isAdmin flag to true...');
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('✅ isAdmin flag updated');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdminUser();