'use strict';

const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});

const adminUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['ADMIN', 'OWNER', 'CLIENT']).optional(),
});

// GET /api/users — admin only
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { bookings: true, studios: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/users/me — update own profile
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/users/:id — admin: update role or status
router.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user id.' });

    const data = adminUpdateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
