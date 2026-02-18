import express from 'express';
import path from 'path';
import multer from 'multer';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = path.resolve('uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 } });

router.post('/request', requireAuth, requireRole('DRIVER'), upload.single('receipt'), async (req, res) => {
  const amount = Number(req.body.amountAzN);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'bad_amount' });

  const receiptPhoto = req.file ? `/uploads/${req.file.filename}` : null;
  if (!receiptPhoto) return res.status(400).json({ error: 'receipt_required' });

  const topup = await prisma.topupRequest.create({
    data: { userId: req.user.uid, amountAzN: amount, receiptPhoto }
  });
  res.json({ topup });
});

router.get('/my', requireAuth, requireRole('DRIVER'), async (req, res) => {
  const items = await prisma.topupRequest.findMany({
    where: { userId: req.user.uid },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json({ items });
});

export default router;
