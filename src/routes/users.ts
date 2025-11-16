// src/routes/users.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import checkRole from '../middleware/checkRole';

const prisma = new PrismaClient();
const router = Router();

// --- Logged-in User Profile Routes ---

// GET /api/users/me: Get the currently logged-in user's profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const myProfile = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!myProfile) {
      return res.status(404).json({ error: 'Profile not found. Contact an administrator.' });
    }
    res.json(myProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/users/me: Update the current user's own profile (e.g., name, phone)
router.put('/me', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;
    const updatedProfile = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      }
    });
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Administrator Routes (Requires 'Admin' Role) ---

// GET /api/users: Get ALL users (Requires Admin)
router.get('/', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/users: Create a new user (Requires Admin)
router.post('/', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, address, dateOfBirth, role, accountStatus } = req.body;
    // Basic validation
    if (!email || !role || !accountStatus) {
      return res.status(400).json({ error: 'Missing required fields: email, role, accountStatus' });
    }
    // Email format validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        role,
        accountStatus
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/users/:id: Get a user by ID (Requires Admin)
router.get('/:id', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/users/:id: Update another user's profile (Role or Status changes)
router.put('/:id', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, accountStatus, firstName, lastName, phone, address, dateOfBirth } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        accountStatus,
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/users/:id: Suspend/Deactivate a user
router.delete('/:id', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { accountStatus: 'suspended' }
    });
    res.status(200).json({ message: 'User successfully suspended' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
