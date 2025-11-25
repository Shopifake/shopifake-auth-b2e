import { Router, Request, Response } from 'express';
import { prisma } from './lib/prisma.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.BETTER_AUTH_SECRET!;

// POST /register: Create Owner account (UC-A1)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      address
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already in use',
        suggestion: 'Try logging in or use password recovery'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address
      }
    });

    // Generate token with roles
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully. Please verify your email.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /login: Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get all roles for the user
    const siteRoles = await prisma.userSiteRole.findMany({
      where: { userId: user.id },
      select: { siteId: true, role: true }
    });

    // Generate token with roles
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        roles: siteRoles,
        firstName: user.firstName,
        lastName: user.lastName
      },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        roles: siteRoles,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;