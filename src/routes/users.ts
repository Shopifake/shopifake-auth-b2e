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
    // Use non-null assertion (!) because checkAuth guarantees req.user exists
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
    const { firstName, lastName, phone, address, birthDate } = req.body;
    const updatedProfile = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName,
        lastName,
        phone,
        address,
        birthDate: birthDate ? new Date(birthDate) : undefined
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

// PUT /api/users/:id: Update another user's profile (Role or Status changes)
router.put('/:id', checkRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // An admin can change the role and accountStatus
    const { role, accountStatus, firstName, lastName } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        role,
        accountStatus,
        firstName,
        lastName
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
    
    // Best practice in B2E is usually to suspend, not hard delete
    await prisma.user.update({
      where: { id: id },
      data: { accountStatus: 'suspended' }
    });

    res.status(200).json({ message: 'User successfully suspended' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
