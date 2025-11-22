// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from 'express';

type UserRole = 'Owner' | 'CM' | 'SM';

const checkRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(403).json({ error: 'User not authenticated' });
            return; // ✅ Important: return void
        }

        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ 
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                userRole: req.user.role
            });
            return; // ✅ Important: return void
        }

        next();
    };
};

export default checkRole;