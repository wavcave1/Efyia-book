'use strict';

const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || '0.08');

const createBookingSchema = z.object({
  studioId: z.number().int().positive(),
  sessionType: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  time: z.string().min(1),
  hours: z.number().int().min(1).max(12),
});

// GET /api/bookings — client sees own; owner sees studio bookings; admin sees all
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let where = {};

    if (req.user.role === 'CLIENT') {
      where = { userId: req.user.id };
    } else if (req.user.role === 'OWNER') {
      const ownedStudios = await prisma.studio.findMany({
        where: { ownerId: req.user.id },
        select: { id: true },
      });
      where = { studioId: { in: ownedStudios.map((s) => s.id) } };
    }
    // ADMIN: no filter — sees all

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        studio: { select: { id: true, name: true, city: true, state: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(bookings);
  } catch (err) {
    return next(err);
  }
});

// GET /api/bookings/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid booking id.' });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        studio: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    // Access control
    if (req.user.role === 'CLIENT' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'OWNER' && booking.studio.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json(booking);
  } catch (err) {
    return next(err);
  }
});

// POST /api/bookings
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Validate date is not in the past
    const bookingDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Booking date cannot be in the past.' });
    }

    const studio = await prisma.studio.findUnique({ where: { id: data.studioId } });
    if (!studio) return res.status(404).json({ error: 'Studio not found.' });

    if (!studio.sessionTypes.includes(data.sessionType)) {
      return res.status(400).json({ error: 'Invalid session type for this studio.' });
    }

    const subtotal = studio.pricePerHour * data.hours;
    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
    const total = subtotal + platformFee;

    const booking = await prisma.booking.create({
      data: {
        studioId: studio.id,
        userId: req.user.id,
        sessionType: data.sessionType,
        date: data.date,
        time: data.time,
        hours: data.hours,
        subtotal,
        platformFee,
        total,
        status: 'PENDING',
      },
      include: {
        studio: { select: { id: true, name: true, city: true, state: true } },
      },
    });

    return res.status(201).json(booking);
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/bookings/:id/status — owner confirms/completes; client cancels; admin can do anything
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid booking id.' });

    const { status } = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { studio: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    // Access control
    if (req.user.role === 'CLIENT') {
      if (booking.userId !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
      if (status !== 'CANCELLED') return res.status(403).json({ error: 'Clients can only cancel bookings.' });
    } else if (req.user.role === 'OWNER') {
      if (booking.studio.ownerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
      if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(403).json({ error: 'Invalid status transition.' });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        studio: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
