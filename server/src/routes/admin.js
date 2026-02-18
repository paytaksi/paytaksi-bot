import express from 'express';
import { prisma } from '../db.js';
import { requireAdminPassword } from '../middleware/adminAuth.js';

const router = express.Router();
router.use(requireAdminPassword);

router.get('/stats', async (req, res) => {
  const [driversPending, topupsPending, ridesOpen] = await Promise.all([
    prisma.user.count({ where: { role: 'DRIVER', driverStatus: 'PENDING' } }),
    prisma.topupRequest.count({ where: { status: 'PENDING' } }),
    prisma.ride.count({ where: { status: { in: ['REQUESTED','ACCEPTED','STARTED'] } } })
  ]);
  res.json({ driversPending, topupsPending, ridesOpen });
});

router.get('/drivers/pending', async (req, res) => {
  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER', driverStatus: 'PENDING' },
    include: { documents: true },
    orderBy: { createdAt: 'asc' },
    take: 50
  });
  res.json({ drivers });
});

router.post('/drivers/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.update({ where: { id }, data: { driverStatus: 'APPROVED' } });
  res.json({ ok: true, user });
});

router.post('/drivers/:id/reject', async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.update({ where: { id }, data: { driverStatus: 'REJECTED' } });
  res.json({ ok: true, user });
});

router.get('/topups/pending', async (req, res) => {
  const items = await prisma.topupRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
    take: 100
  });
  res.json({ items });
});

router.post('/topups/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const topup = await prisma.topupRequest.findUnique({ where: { id }, include: { user: true } });
  if (!topup || topup.status !== 'PENDING') return res.status(404).json({ error: 'not_found' });

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.topupRequest.update({ where: { id }, data: { status: 'APPROVED' } });
    await tx.user.update({ where: { id: topup.userId }, data: { balance: { increment: topup.amountAzN } } });
    return t;
  });

  res.json({ ok: true, topup: updated });
});

router.post('/topups/:id/reject', async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.topupRequest.update({ where: { id }, data: { status: 'REJECTED', adminNote: String(req.body?.note || '') } });
  res.json({ ok: true, topup: updated });
});

router.get('/rides', async (req, res) => {
  const rides = await prisma.ride.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { passenger: true, driver: true }
  });
  res.json({ rides });
});

export default router;
