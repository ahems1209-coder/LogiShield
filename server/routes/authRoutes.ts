/**
 * LogiShield AI - Authentication API Controller & Routes
 */

import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'logishield-dev-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory fallback accounts for prototype robustness
const memoryUsers = [
  {
    id: 'usr-admin-01',
    email: 'admin@logishield.demo',
    passwordHash: bcrypt.hashSync('LogiShield@2026', 10),
    name: 'Commander General (Admin)',
    role: 'ADMIN',
  },
  {
    id: 'usr-super-01',
    email: 'supervisor@logishield.demo',
    passwordHash: bcrypt.hashSync('LogiShield@2026', 10),
    name: 'Logistics Supervisor',
    role: 'SUPERVISOR',
  },
  {
    id: 'usr-planner-01',
    email: 'planner@logishield.demo',
    passwordHash: bcrypt.hashSync('LogiShield@2026', 10),
    name: 'V. Ramanathan (Planner)',
    role: 'LOGISTICS_PLANNER',
  },
];

// POST /api/auth/register
router.post('/register', async (req: express.Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required.',
      });
    }

    const assignedRole = ['ADMIN', 'SUPERVISOR', 'LOGISTICS_PLANNER'].includes(role)
      ? role
      : 'LOGISTICS_PLANNER';

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}`;

    // Try DB first
    try {
      const dbRes = await query(
        `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role`,
        [userId, email.toLowerCase(), passwordHash, name, assignedRole]
      );

      if (dbRes && dbRes.rows[0]) {
        const newUser = dbRes.rows[0];
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN as any }
        );

        return res.status(201).json({
          success: true,
          token,
          user: newUser,
        });
      }
    } catch (dbErr) {
      // DB duplicate email check
    }

    // Memory store fallback
    if (memoryUsers.some(u => u.email === email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    const memUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: assignedRole,
    };
    memoryUsers.push(memUser);

    const token = jwt.sign(
      { userId: memUser.id, email: memUser.email, role: memUser.role, name: memUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: memUser.id, email: memUser.email, name: memUser.name, role: memUser.role },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: express.Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try DB lookup
    let targetUser: any = null;
    try {
      const dbRes = await query(`SELECT * FROM users WHERE email = $1`, [cleanEmail]);
      if (dbRes && dbRes.rows[0]) {
        targetUser = {
          id: dbRes.rows[0].id,
          email: dbRes.rows[0].email,
          passwordHash: dbRes.rows[0].password_hash,
          name: dbRes.rows[0].name,
          role: dbRes.rows[0].role,
        };
      }
    } catch (dbErr) {
      // Fallback
    }

    // 2. Memory lookup if DB not available or user not found
    if (!targetUser) {
      targetUser = memoryUsers.find(u => u.email === cleanEmail);
    }

    if (!targetUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await bcrypt.compare(password, targetUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        name: targetUser.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      success: true,
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout
router.post('/logout', (req: express.Request, res: Response) => {
  res.json({
    success: true,
    message: 'User logged out successfully.',
  });
});

export default router;
