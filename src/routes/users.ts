// src/routes/users.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.config';
import jwt from 'jsonwebtoken';

const router = Router();

// Authentication middleware - extracts user from JWT cookie
const authenticate = (req: Request, res: Response, next: any) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const decoded = jwt.verify(token, process.env.BETTER_AUTH_SECRET!) as any;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticate);

// --- Logged-in User Profile Routes ---

// GET users/me: Get the currently logged-in user's profile
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

// PUT /users/me: Update the current user's own profile
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

// DELETE users/me: Delete own account (RGPD compliance)
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

// GET /me/sites: List of managed sites
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

// POST /me/sites: Add a managed site
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

// PUT /me/sites/:siteId: Update role for a managed site
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

// DELETE /me/sites/:siteId: Remove a managed site
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

// --- Owner Site User Management ---

// Middleware to check if current user is owner of the site
async function checkSiteOwner(req: Request, res: Response, next: any) {
  const siteId = req.params.siteId;
  const ownerRole = await prisma.userSiteRole.findUnique({
    where: { userId_siteId: { userId: req.user!.id, siteId } },
    select: { role: true }
  });
  if (ownerRole?.role !== 'Owner') {
    return res.status(403).json({ error: 'Not authorized: must be site owner.' });
  }
  next();
}

// GET /me/sites/:siteId/users: Get all users for a site you own
router.get('/me/sites/:siteId/users', checkSiteOwner, async (req: Request, res: Response) => {
  try {
    const users = await prisma.userSiteRole.findMany({
      where: { siteId: req.params.siteId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /me/sites/:siteId/users: Add a user to your site
router.post('/me/sites/:siteId/users', checkSiteOwner, async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const existing = await prisma.userSiteRole.findUnique({ 
      where: { userId_siteId: { userId: user.id, siteId: req.params.siteId } } 
    });
    if (existing) return res.status(400).json({ error: 'User already has a role for this site.' });

    if (!['Owner', 'CM', 'SM'].includes(role)) {
      return res.status(400).json({ error: 'Role must be Owner, CM or SM.' });
    }

    const entry = await prisma.userSiteRole.create({ 
      data: { userId: user.id, siteId: req.params.siteId, role } 
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /me/sites/:siteId/users: Change a user's role for your site (by email)
router.put('/me/sites/:siteId/users', checkSiteOwner, async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required.' });

    if (!['CM', 'SM'].includes(role)) {
      return res.status(400).json({ error: 'Role must be CM or SM.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const entry = await prisma.userSiteRole.update({
      where: { userId_siteId: { userId: user.id, siteId: req.params.siteId } },
      data: { role }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /me/sites/:siteId/users: Remove a user from your site (by email)
router.delete('/me/sites/:siteId/users', checkSiteOwner, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await prisma.userSiteRole.delete({
      where: { userId_siteId: { userId: user.id, siteId: req.params.siteId } }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;