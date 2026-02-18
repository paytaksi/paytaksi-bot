import express from 'express';
import fetch from 'node-fetch';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calcFare, calcCommission } from '../utils.js';

const router = express.Router();

async function osrmDistanceKm(pickupLat, pickupLon, dropLat, dropLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${dropLon},${dropLat}?overview=false`;
  const r = await fetch(url, { timeout: 8000 });
  if (!r.ok) throw new Error('osrm_failed');
  const j = await r.json();
  const meters = j?.routes?.[0]?.distance;
  if (!meters) throw new Error('osrm_no_distance');
  return Math.round((meters / 1000) * 100) / 100;
}

router.post('/create', requireAuth, requireRole('PASSENGER'), async (req, res) => {
  const b = req.body || {};
  const ride = await prisma.ride.create({
    data: {
      passengerId: req.user.uid,
      pickupLat: Number(b.pickupLat),
      pickupLon: Number(b.pickupLon),
      pickupAddr: String(b.pickupAddr || ''),
      dropLat: Number(b.dropLat),
      dropLon: Number(b.dropLon),
      dropAddr: String(b.dropAddr || '')
    }
  });
  res.json({ ride });
});

router.get('/my', requireAuth, async (req, res) => {
  const role = req.user.role;
  const where = role === 'DRIVER'
    ? { driverId: req.user.uid }
    : { passengerId: req.user.uid };

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  res.json({ rides });
});

// Driver sees requested rides (simple: latest unassigned)
router.get('/driver/offers', requireAuth, requireRole('DRIVER'), async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.uid } });
  if (!me) return res.status(404).json({ error: 'no_user' });

  if (me.driverStatus !== 'APPROVED') {
    return res.json({ offers: [], blocked: true, reason: 'driver_not_approved' });
  }

  if (me.balance <= -15) {
    return res.json({ offers: [], blocked: true, reason: 'balance_limit', message: 'Balans -15 AZN və daha aşağıdır. Sifariş qəbul etmək qadağandır.' });
  }

  const offers = await prisma.ride.findMany({
    where: { status: 'REQUESTED', driverId: null },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  res.json({ offers, blocked: false });
});

router.post('/driver/accept', requireAuth, requireRole('DRIVER'), async (req, res) => {
  const rideId = Number(req.body.rideId);
  const me = await prisma.user.findUnique({ where: { id: req.user.uid } });
  if (!me) return res.status(404).json({ error: 'no_user' });

  if (me.driverStatus !== 'APPROVED') return res.status(403).json({ error: 'driver_not_approved' });
  if (me.balance <= -15) return res.status(403).json({ error: 'balance_limit', message: 'Balans -15 AZN və daha aşağıdır.' });

  // Accept if still unassigned
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.status !== 'REQUESTED' || ride.driverId) return res.status(409).json({ error: 'already_taken' });

  const updated = await prisma.ride.update({
    where: { id: rideId },
    data: { driverId: req.user.uid, status: 'ACCEPTED' }
  });

  res.json({ ride: updated });
});

router.post('/driver/start', requireAuth, requireRole('DRIVER'), async (req, res) => {
  const rideId = Number(req.body.rideId);
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.driverId !== req.user.uid) return res.status(404).json({ error: 'ride_not_found' });

  const updated = await prisma.ride.update({ where: { id: rideId }, data: { status: 'STARTED' } });
  res.json({ ride: updated });
});

router.post('/driver/complete', requireAuth, requireRole('DRIVER'), async (req, res) => {
  const rideId = Number(req.body.rideId);
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.driverId !== req.user.uid) return res.status(404).json({ error: 'ride_not_found' });

  let distanceKm = null;
  try {
    distanceKm = await osrmDistanceKm(ride.pickupLat, ride.pickupLon, ride.dropLat, ride.dropLon);
  } catch {
    // fallback: client distance
    distanceKm = Number(req.body.distanceKm || 0);
  }

  const fareAzN = calcFare(distanceKm);
  const commissionAzN = calcCommission(fareAzN);

  const updated = await prisma.$transaction(async (tx) => {
    const r2 = await tx.ride.update({
      where: { id: rideId },
      data: {
        status: 'COMPLETED',
        distanceKm,
        fareAzN,
        commissionAzN
      }
    });

    await tx.user.update({
      where: { id: req.user.uid },
      data: { balance: { decrement: commissionAzN } }
    });

    return r2;
  });

  res.json({ ride: updated, fareAzN, commissionAzN });
});

export default router;
