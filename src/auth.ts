import { Router, Request, Response } from 'express';
import { prisma } from './lib/prisma.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const ACCESS_SECRET = process.env.BETTER_AUTH_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// Helper to set cookies
const setTokens = (res: Response, userId: string, email: string) => {
  const b2e_accessToken = jwt.sign({ id: userId, email }, ACCESS_SECRET, { expiresIn: '15m' });
  const b2e_refreshToken = jwt.sign({ id: userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('b2e_accessToken', b2e_accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });

  res.cookie('b2e_refreshToken', b2e_refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/refresh'
  });

  return b2e_refreshToken;
};

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const b2e_refreshToken = setTokens(res, user.id, user.email);

    // Remove old refresh tokens & store the new one
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({ data: { token: b2e_refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });

    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, firstName, lastName, phone, address }
    });
    setTokens(res, user.id, user.email);
    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, address: user.address } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.b2e_refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, REFRESH_SECRET) as any;
    const stored = await prisma.refreshToken.findFirst({ where: { token, userId: decoded.id, expiresAt: { gt: new Date() } } });
    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    setTokens(res, user.id, user.email);
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.b2e_refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });

    res.clearCookie('b2e_accessToken').clearCookie('b2e_refreshToken').json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.b2e_accessToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
