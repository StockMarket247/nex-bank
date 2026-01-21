import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminModel = app.get(getModelToken(Admin.name));

  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create super admin
  const superAdmin = await adminModel.findOneAndUpdate(
    { email: 'admin@gbh.com' },
    {
      email: 'admin@gbh.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    { upsert: true, new: true },
  );

  console.log('✅ Created super admin:', superAdmin.email);

  // Create regular admin
  const admin = await adminModel.findOneAndUpdate(
    { email: 'admin2@gbh.com' },
    {
      email: 'admin2@gbh.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
    { upsert: true, new: true },
  );

  console.log('✅ Created admin:', admin.email);

  // Create auditor
  const auditor = await adminModel.findOneAndUpdate(
    { email: 'auditor@gbh.com' },
    {
      email: 'auditor@gbh.com',
      password: hashedPassword,
      firstName: 'Auditor',
      lastName: 'User',
      role: 'AUDITOR',
      isActive: true,
    },
    { upsert: true, new: true },
  );

  console.log('✅ Created auditor:', auditor.email);

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Default admin credentials:');
  console.log('   Email: admin@gbh.com');
  console.log('   Password: Admin@123');

  await app.close();
}

bootstrap()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });

