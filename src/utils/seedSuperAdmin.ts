import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    await connectDB();

    const existingSuperAdmin = await User.findOne({
      $or: [
        { role: 'SUPER_ADMIN' },
        { email: env.SUPER_ADMIN_EMAIL.toLowerCase() },
      ],
    });

    if (existingSuperAdmin) {
      console.log(`ℹ️ Super Admin already exists with email: ${existingSuperAdmin.email}`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, salt);

    const superAdmin = await User.create({
      name: 'ETM Platform Super Admin',
      email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'active',
      companyId: null,
    });

    console.log('🎉 Super Admin provisioned successfully!');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${env.SUPER_ADMIN_PASSWORD}`);
  } catch (error: any) {
    console.error('❌ Error seeding Super Admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Execute if run directly
if (require.main === module) {
  seedSuperAdmin().then(() => process.exit(0));
}
