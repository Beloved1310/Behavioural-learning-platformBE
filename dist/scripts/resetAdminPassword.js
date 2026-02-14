"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
const types_1 = require("../types");
const resetAdminPassword = async () => {
    try {
        console.log('🔐 Starting admin password reset...');
        // Connect to database
        await database_1.default.connect();
        // Find admin user
        const admin = await models_1.User.findOne({
            role: types_1.UserRole.ADMIN,
            email: 'admin@behaviorallearning.com',
        });
        if (!admin) {
            console.log('❌ Admin user not found. Creating new admin user...');
            // Create admin if it doesn't exist
            const hashedPassword = await bcryptjs_1.default.hash('Password123!', 12);
            const newAdmin = await models_1.User.create({
                email: 'admin@behaviorallearning.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: types_1.UserRole.ADMIN,
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
        const hashedPassword = await bcryptjs_1.default.hash('Password123!', 12);
        // Update password directly using findByIdAndUpdate to bypass pre-save hook
        await models_1.User.findByIdAndUpdate(admin._id, {
            password: hashedPassword,
            isVerified: true,
        });
        console.log('✅ Password updated in database');
        // Verify the password was set correctly
        const testUser = await models_1.User.findOne({ email: 'admin@behaviorallearning.com' }).select('+password');
        if (testUser && testUser.password) {
            const isValid = await bcryptjs_1.default.compare('Password123!', testUser.password);
            if (isValid) {
                console.log('✅ Admin password reset successfully!');
                console.log('📧 Email: admin@behaviorallearning.com');
                console.log('🔑 Password: Password123!');
                console.log('✅ Password verification test passed!');
            }
            else {
                console.error('❌ Password verification test failed!');
            }
        }
        else {
            console.error('❌ Could not retrieve password after reset!');
        }
    }
    catch (error) {
        console.error('❌ Error resetting admin password:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('📴 Database connection closed');
    }
};
// Run the reset function
resetAdminPassword();
//# sourceMappingURL=resetAdminPassword.js.map