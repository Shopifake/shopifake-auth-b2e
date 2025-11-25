// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from 'express';

type UserRole = 'Owner' | 'CM' | 'SM';

const checkRole = (siteId: string, allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(403).json({ error: 'User not authenticated' });
            return;
        }

        // Check if user has one of the allowed roles for this specific site
        const userSiteRole = req.user.roles?.find(r => r.siteId === siteId);
        
        if (!userSiteRole) {
            res.status(403).json({ 
                error: 'Access denied. You don\'t have access to this site.',
            });
            return;
        }

        if (!allowedRoles.includes(userSiteRole.role as UserRole)) {
            res.status(403).json({ 
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                userRole: userSiteRole.role
            });
            return;
        }

        next();
    };
};

export default checkRole;