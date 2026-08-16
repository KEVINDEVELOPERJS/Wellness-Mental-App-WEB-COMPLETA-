import { Request, Response, NextFunction } from 'express';

export interface AuditLog {
  timestamp: Date;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: number;
  statusCode: number;
  responseTime: number;
}

export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request details
  const auditData: AuditLog = {
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    userId: (req as any).user?.userId,
    statusCode: res.statusCode,
    responseTime: 0,
  };

  // Log response
  res.on('finish', () => {
    auditData.statusCode = res.statusCode;
    auditData.responseTime = Date.now() - startTime;

    // Log to console (in production, this would go to a proper logging service)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${JSON.stringify(auditData)}`);
    }

    // Log sensitive operations
    if (req.path.includes('/auth/') || req.path.includes('/alertas/')) {
      console.log(`[SENSITIVE OPERATION] ${req.method} ${req.path} by user ${auditData.userId}`);
    }
  });

  next();
};
