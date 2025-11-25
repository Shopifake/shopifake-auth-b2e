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
    const { firstName, lastName, phone, address } = req.body;
    
    const updatedProfile = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName,
        lastName,
        phone,
        address,
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
    
    // Anonymize user (RGPD compliance)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: `deleted_${req.user!.id}@anonymized.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        address: null,
        deletionReason: reason,
        deletedAt: new Date()
      }
    });
    
    res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /me/sites : List of managed sites
router.get('/me/sites', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.userSiteRole.findMany({
      where: { userId: req.user!.id },
      select: { siteId: true, role: true }
    });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /me/sites : Add a managed site
router.post('/me/sites', async (req: Request, res: Response) => {
  try {
    const { siteId, role } = req.body;
    const entry = await prisma.userSiteRole.create({
      data: { userId: req.user!.id, siteId, role }
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /me/sites/:siteId : Update role for a managed site
router.put('/me/sites/:siteId', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const entry = await prisma.userSiteRole.update({
      where: { userId_siteId: { userId: req.user!.id, siteId: req.params.siteId } },
      data: { role }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /me/sites/:siteId : Remove a managed site
router.delete('/me/sites/:siteId', async (req: Request, res: Response) => {
  try {
    await prisma.userSiteRole.delete({
      where: { userId_siteId: { userId: req.user!.id, siteId: req.params.siteId } }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;