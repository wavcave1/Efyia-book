'use strict';

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(20).max(2000).optional(),
  richDescription: z.string().max(10000).optional(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  coverUrl: z.string().url().max(500).optional().nullable(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  themeOverride: z.enum(['light', 'dark']).optional().nullable(),
  fontPairing: z.enum(['modern', 'editorial', 'minimal', 'bold', 'warm']).optional(),
  layoutType: z.enum(['minimal', 'hero', 'split', 'grid']).optional(),
  socialLinks: z
    .object({
      instagram: z.string().max(200).optional(),
      twitter: z.string().max(200).optional(),
      facebook: z.string().max(200).optional(),
      youtube: z.string().max(200).optional(),
      soundcloud: z.string().max(200).optional(),
      website: z.string().url().max(200).optional(),
    })
    .optional()
    .nullable(),
  contactInfo: z
    .object({
      phone: z.string().max(30).optional(),
      email: z.string().email().max(200).optional(),
      bookingUrl: z.string().url().max(200).optional(),
    })
    .optional()
    .nullable(),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        price: z.number().positive().optional(),
        unit: z.string().max(30).optional(),
      })
    )
    .max(20)
    .optional()
    .nullable(),
});

// PATCH /api/studio/profile — owner updates their own studio branding
router.patch(
  '/',
  requireAuth,
  requireRole('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      // Find studio owned by the requesting user
      const studio = await prisma.studio.findFirst({
        where: { ownerId: req.user.id },
      });

      if (!studio) {
        return res.status(404).json({ error: 'No studio found for your account.' });
      }

      const data = profileSchema.parse(req.body);
      const updated = await prisma.studio.update({
        where: { id: studio.id },
        data,
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/studio/profile — owner fetches their own studio (with full branding fields)
router.get(
  '/',
  requireAuth,
  requireRole('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const studio = await prisma.studio.findFirst({
        where: { ownerId: req.user.id },
        include: {
          reviews: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!studio) {
        return res.status(404).json({ error: 'No studio found for your account.' });
      }

      return res.json(studio);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
