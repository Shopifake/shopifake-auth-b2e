// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from 'express';

// Vérifie que l'utilisateur a au moins un des rôles demandés
const checkRole = (allowedRoles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(403).json({ error: 'User not authenticated' });
		}
		const hasRole = req.user.roles?.some((role: string) => allowedRoles.includes(role));
		if (!hasRole) {
			return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
		}
		next();
	};
};

export default checkRole;
