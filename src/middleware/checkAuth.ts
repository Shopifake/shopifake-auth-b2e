// src/middleware/checkAuth.ts
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { BetterAuthUser } from '../types/express'; // Import our custom user type

const BETTER_AUTH_ME_URL = process.env.BETTER_AUTH_ME_URL;

if (!BETTER_AUTH_ME_URL) {
  throw new Error("BETTER_AUTH_ME_URL is not defined in .env");
}

async function checkAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing (expected format "Bearer <token>")' });
  }

  try {
    // 1. Call BetterAuth endpoint to validate the token signature and expiration
    const response = await axios.get<BetterAuthUser>(BETTER_AUTH_ME_URL!, {
    headers: { 'Authorization': `Bearer ${token}` }
    });

    // 2. Token is valid. Attach user info (ID, roles) to the request object
    req.user = response.data;

    // 3. Ensure essential data (ID and roles) is present
    if (!(req.user?.id && req.user?.roles)) {
      throw new Error('Invalid token payload from BetterAuth');
    }

    next();
  } catch (error) {
    // If axios call fails (e.g., 401 from BetterAuth), the token is invalid or expired
    console.error('Token validation error:', (error as Error).message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default checkAuth;
