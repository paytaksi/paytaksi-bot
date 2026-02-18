import express from 'express';
import path from 'path';
import multer from 'multer';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = path.resolve('uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    const name = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 } });

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.uid },
    include: { documents: true }
  });
  res.json({ user });
});

router.post('/update', requireAuth, async (req, res) => {
  const body = req.body || {};

  // phone expected like +994XXXXXXXXX
  const phone = String(body.phone || '').trim();
  if (phone && !phone.startsWith('+994')) {
    return res.status(400).json({ error: 'phone_must_start_with_+994' });
  }

  const update = {
    firstName: body.firstName?.trim() || undefined,
    lastName: body.lastName?.trim() || undefined,
    phone: phone || undefined,
    operator: body.operator || undefined,
    carBrand: body.carBrand || undefined,
    carModel: body.carModel || undefined,
    carPlate: body.carPlate || undefined
  };

  const user = await prisma.user.update({ where: { id: req.user.uid }, data: update });

  res.json({ ok: true, user });
});

router.post('/upload', requireAuth, upload.fields([
  { name: 'carPhoto', maxCount: 1 },
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'idFrontPhoto', maxCount: 1 },
  { name: 'idBackPhoto', maxCount: 1 },
  { name: 'techPassportFront', maxCount: 1 },
  { name: 'techPassportBack', maxCount: 1 }
]), async (req, res) => {
  const files = req.files || {};
  const pick = (k) => (files[k] && files[k][0] ? `/uploads/${files[k][0].filename}` : undefined);

  const carPhoto = pick('carPhoto');

  // Ensure driver documents row exists
  const docData = {
    licensePhoto: pick('licensePhoto'),
    idFrontPhoto: pick('idFrontPhoto'),
    idBackPhoto: pick('idBackPhoto'),
    techPassportFront: pick('techPassportFront'),
    techPassportBack: pick('techPassportBack')
  };

  await prisma.user.update({
    where: { id: req.user.uid },
    data: {
      carPhoto: carPhoto || undefined,
      documents: {
        upsert: {
          create: { ...docData },
          update: { ...docData }
        }
      }
    }
  });

  res.json({ ok: true });
});

export default router;
