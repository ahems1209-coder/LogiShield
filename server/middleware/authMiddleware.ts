/**
 * LogiShield AI - Authentication & Role-Based Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'LOGISTICS_PLANNER';
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'logishield-dev-secret-key-2026';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.cookies && req.cookies.token ? req.cookies.token : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required for authentication.',
      errorCode: 'UNAUTHORIZED_MISSING_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || 'Logistics Officer',
    };
    next();
  } catch (err: any) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      errorCode: 'FORBIDDEN_INVALID_TOKEN',
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Role '${req.user.role}' is not authorized for this operation.`,
        errorCode: 'FORBIDDEN_INSUFFICIENT_ROLE',
      });
    }

    next();
  };
}
