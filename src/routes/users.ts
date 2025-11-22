// src/routes/users.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.config';

const router = Router();

// --- Logged-in User Profile Routes ---

// GET /api/users/me: Get the currently logged-in user's profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const myProfile = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!myProfile) {
      return res.status(404).json({ error: 'Profile not found. Contact an administrator.' });
    }
    
    res.json(myProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/users/me: Update the current user's own profile (UC-A2)
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
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      }
    });
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/users/me: Delete own account (RGPD - UC-A3)
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    // Anonymize or delete user (RGPD compliance)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: `deleted_${req.user!.id}@anonymized.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        address: null,
        accountStatus: 'deleted',
        deletionReason: reason,
        deletedAt: new Date()
      }
    });
    
    res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;