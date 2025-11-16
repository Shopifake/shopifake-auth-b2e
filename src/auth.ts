import { betterAuth } from 'better-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  adapter: {
    type: 'postgresql',
    prisma,
    userModel: 'User',
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  additionalFields: [
    'firstName',
    'lastName',
    'phone',
    'address',
    'dateOfBirth',
    'role',
    'accountStatus',
    'externalId',
    'authUserId',
  ],
  plugins: [
    // Add plugins here if needed, e.g. webhook, admin
  ],
});