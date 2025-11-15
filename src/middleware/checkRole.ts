// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from 'express';

// Factory function that returns a middleware checking the role
const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is guaranteed to be set here because checkAuth runs first
    if (!req.user) {
      // This should ideally not happen if checkAuth is run correctly
      return res.status(403).json({ error: 'User not authenticated' });
    }

    // Check if the user has at least one of the required roles
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

export default checkRole;
