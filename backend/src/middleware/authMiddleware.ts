import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/JwtService';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    rol: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await JwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const payload = JwtService.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const authorizeSelfOrRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const targetUserId = parseInt(req.params.id || req.body.usuarioId);
    
    // Allow if user is requesting their own data or has authorized role
    if (req.user.userId === targetUserId || roles.includes(req.user.rol)) {
      next();
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
