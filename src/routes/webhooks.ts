// src/routes/webhooks.ts
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const WEBHOOK_SECRET = process.env.BETTER_AUTH_WEBHOOK_SECRET;

// Middleware to verify the webhook secret
function checkWebhookSecret(req: Request, res: Response, next: NextFunction) {
  // Use the header BetterAuth specifies, e.g., 'X-BetterAuth-Secret'
  const providedSecret = req.header('X-BetterAuth-Secret'); 
  
  if (providedSecret !== WEBHOOK_SECRET) {
    console.warn("Unauthorized webhook attempt detected.");
    return res.status(403).json({ error: 'Invalid webhook secret' });
  }
  next();
}

// Interface for BetterAuth Webhook Event structure

// Accepts both { type, data } and { event, user } for compatibility
interface WebhookEvent {
  type?: string;
  event?: string;
  data?: {
    id: string;
    email: string;
    // ... potentially other user data
  };
  user?: {
    id: string;
    email: string;
    // ... potentially other user data
  };
}

// Endpoint for synchronization (Protected by the secret check)

router.post('/sync', checkWebhookSecret, async (req: Request, res: Response) => {
  const body = req.body as WebhookEvent;
  // Accept both 'type' and 'event' for compatibility
  const eventType = body.type || body.event;
  const userData = body.data || body.user;

  if (!eventType || !userData || !userData.id || !userData.email) {
    console.warn('Invalid webhook payload received:', req.body);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    switch (eventType) {
      case 'user.created':
      case 'user_created':
        console.log('Webhook received: user.created', userData.email);
        await prisma.user.upsert({
          where: { id: userData.id },
          create: {
            id: userData.id,
            email: userData.email,
            role: 'SM',
            accountStatus: 'unverified'
          },
          update: {
            email: userData.email
          }
        });
        break;
      case 'user.deleted':
      case 'user_deleted':
        console.log('Webhook received: user.deleted', userData.id);
        await prisma.user.update({
          where: { id: userData.id },
          data: { accountStatus: 'suspended' }
        });
        break;
      default:
        console.warn(`Unhandled webhook event type: ${eventType}`);
        return res.status(400).json({ error: `Unhandled webhook event type: ${eventType}` });
    }
    res.status(200).send({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', (error as Error).message);
    res.status(500).json({ error: 'Internal server error processing webhook' });
  }
});

export default router;
