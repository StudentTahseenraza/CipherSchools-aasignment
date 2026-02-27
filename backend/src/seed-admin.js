import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './models/mongodb/User.model.js';

dotenv.config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      
      // Update password to ensure it's correct
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      existingAdmin.passwordHash = hashedPassword;
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated');
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        name: 'Administrator',
        isAdmin: true,
        createdAt: new Date()
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser();