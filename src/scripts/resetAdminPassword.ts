import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import database from '../config/database';
import { User } from '../models';
import { UserRole } from '../types';

const resetAdminPassword = async () => {
  try {
    console.log('🔐 Starting admin password reset...');

    // Connect to database
    await database.connect();

    // Find admin user
    const admin = await User.findOne({
      role: UserRole.ADMIN,
      email: 'admin@behaviorallearning.com',
    });

    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin user...');

      // Create admin if it doesn't exist
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const newAdmin = await User.create({
        email: 'admin@behaviorallearning.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isVerified: true,
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@behaviorallearning.com');
      console.log('🔑 Password: Password123!');
      return;
    }

    // Reset password
    console.log(`📧 Found admin user: ${admin.email}`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    // Update password directly using findByIdAndUpdate to bypass pre-save hook
    await User.findByIdAndUpdate(admin._id, {
      password: hashedPassword,
      isVerified: true,
    });

    console.log('✅ Password updated in database');

    // Verify the password was set correctly
    const testUser = await User.findOne({ email: 'admin@behaviorallearning.com' }).select(
      '+password'
    );

    if (testUser && testUser.password) {
      const isValid = await bcrypt.compare('Password123!', testUser.password);
      if (isValid) {
        console.log('✅ Admin password reset successfully!');
        console.log('📧 Email: admin@behaviorallearning.com');
        console.log('🔑 Password: Password123!');
        console.log('✅ Password verification test passed!');
      } else {
        console.error('❌ Password verification test failed!');
      }
    } else {
      console.error('❌ Could not retrieve password after reset!');
    }
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
};

// Run the reset function
resetAdminPassword();
