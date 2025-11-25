// src/middleware/checkAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.BETTER_AUTH_SECRET!;

interface JWTPayload {
  id: string;
  email?: string;
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
    
    req.user = {
      id: payload.id,
      email: payload.email || '',
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    
    next();
  } catch {
    res.status(401).json({ error: 'Token verification failed' });
    return;
  }
}