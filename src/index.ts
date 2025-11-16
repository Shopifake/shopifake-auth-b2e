// src/index.ts
import 'dotenv/config'; // Loads environment variables from .env
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Import Routers
// Removed webhook routes as per the requirement
import userRoutes from './routes/users';

// Import Middleware
import { checkAuth } from './middleware/checkAuth';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware to parse incoming JSON bodies (essential for both routes and webhooks)
app.use(express.json());

// --- Protected Routes ---
// All routes defined below will automatically run the checkAuth middleware
app.use('/api/users', checkAuth, userRoutes);

// --- Healthcheck route for Kubernetes ---
app.get('/healthz', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'available';
  } catch (err) {
    dbStatus = 'unavailable';
  }
  res.status(dbStatus === 'available' ? 200 : 503).json({
    status: 'ok',
    db: dbStatus,
    service: 'up'
  });
});

// Root test route
app.get('/', (req, res) => {
  res.send('Shopifake BetterAuth Microservice is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 Microservice started on http://localhost:${PORT}`);
});
