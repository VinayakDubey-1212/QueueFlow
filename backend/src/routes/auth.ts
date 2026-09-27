import { Router } from 'express';
import { db } from '../db';
import { checkPassword, hashPassword, requireAuth, signToken, AuthedRequest } from '../auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'email, password, and fullName are required' });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = await db.user.create({
    data: {
      email,
      fullName,
      role: role === 'STAFF' || role === 'ADMIN' ? role : 'CUSTOMER',
      passwordHash: await hashPassword(password),
    },
  });

  const token = signToken({ userId: user.id, role: user.role, fullName: user.fullName });
  res.status(201).json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.user.findUnique({ where: { email } });

  // Same error either way — don't reveal whether the email exists.
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ userId: user.id, role: user.role, fullName: user.fullName });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await db.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
});
