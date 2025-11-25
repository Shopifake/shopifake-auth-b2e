// src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create mock prisma
export const prismaMock = mockDeep<PrismaClient>();

// Mock the prisma config module
jest.mock('../lib/prisma.config', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});