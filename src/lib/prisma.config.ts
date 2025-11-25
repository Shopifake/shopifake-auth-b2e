import { PrismaClient } from '@prisma/client'; 
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; 

// 1. Get the connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

// 2. Instantiate the 'pg' Pool and the Prisma Adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Instantiate PrismaClient with the adapter
const prisma = new PrismaClient({ adapter });

export { prisma };