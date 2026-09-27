import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function checkPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export interface TokenPayload {
  userId: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  fullName: string;
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Extends Express's Request type so `req.user` is available after this
// middleware runs, without needing a separate types file.
export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

/** Reads "Authorization: Bearer <token>", verifies it, attaches req.user. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as TokenPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/** Use after requireAuth to restrict a route to specific roles. */
export function requireRole(...roles: TokenPayload['role'][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that' });
    }
    next();
  };
}
