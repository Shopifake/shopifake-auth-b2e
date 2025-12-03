import { PrismaClient } from '@prisma/client'; 
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; 

declare global {
  var prisma: PrismaClient | undefined;
}

// TODO: Remove DATABASE_URL fallback after migration (thanks Matthéo)
// Construct connection string from individual env vars or use legacy DATABASE_URL
let connectionString: string;

if (process.env.DATABASE_URL) {
  console.warn('⚠️  WARNING: Using legacy DATABASE_URL environment variable');
  console.warn('⚠️  Please migrate to: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  console.warn('⚠️  This fallback will be removed in a future version (thanks Matthéo)');
  connectionString = process.env.DATABASE_URL;
} else {
  // Validate required database environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required database environment variables:', missingVars.join(', '));
    console.error('💡 Please set: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  const DB_HOST = process.env.DB_HOST!;
  const DB_PORT = process.env.DB_PORT!;
  const DB_NAME = process.env.DB_NAME!;
  const DB_USER = process.env.DB_USER!;
  const DB_PASSWORD = process.env.DB_PASSWORD!;

  connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  console.log('📊 Database configuration:');
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   User: ${DB_USER}`);
  console.log(`   Connection string: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Test connection
pool.connect()
  .then((client) => {
    console.log('✅ Database pool connected successfully');
    client.release();
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('💡 Check your DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD');
  });

const prisma = global.prisma || new PrismaClient({ 
  adapter,
  log: ['error', 'warn']
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };