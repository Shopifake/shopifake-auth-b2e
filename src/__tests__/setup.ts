// src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock Prisma Client
jest.mock('../lib/prisma.config', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  const { prisma } = require('../lib/prisma.config');
  mockReset(prisma);
});