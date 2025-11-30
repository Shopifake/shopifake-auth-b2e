// src/index.ts
import './instrumentation';
import 'dotenv/config';
import express from 'express';
import { prisma } from './lib/prisma.config';

import userRoutes from './routes/users';
import authRoutes from './auth';
import { checkAuth } from './middleware/checkAuth';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());

app.set('trust proxy', true);

// --- Routes ---
app.use('/', authRoutes);
app.use('/users', checkAuth, userRoutes);

// --- Healthcheck ---
app.get('/healthz', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'available';
  } catch {
    dbStatus = 'unavailable';
  }
  const isHealthy = dbStatus === 'available';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    db: dbStatus,
    service: 'user-auth-service'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Shopifake User/Auth Microservice',
    version: '1.0.0',
    endpoints: {
      auth: '/',
      users: '/users',
      health: '/healthz'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 User Service on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});