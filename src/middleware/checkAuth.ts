// src/middleware/checkAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.BETTER_AUTH_SECRET!;

interface JWTPayload {
  id: string;
  email: string;
  role: 'Owner' | 'CM' | 'SM';
  firstName?: string;
  lastName?: string;
}

export function checkAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  // Robust token extraction
  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as JWTPayload;
    if (!['Owner', 'CM', 'SM'].includes(payload.role)) {
      res.status(401).json({ error: 'Invalid user role' });
      return;
    }
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
    return;
  }
}