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
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await JwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const payload = JwtService.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    // Ensure CORS headers are present on auth error responses
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.rol)) {
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const authorizeSelfOrRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const targetUserId = parseInt(req.params.id || req.body.usuarioId);
    
    // Allow if user is requesting their own data or has authorized role
    if (req.user.userId === targetUserId || roles.includes(req.user.rol)) {
      next();
    } else {
      // Ensure CORS headers are present on auth error responses
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
