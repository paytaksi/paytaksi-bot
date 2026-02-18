import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { verifyTelegramInitData } from '../utils.js';

const router = express.Router();

function botTokenFor(kind) {
  if (kind === 'passenger') return process.env.BOT_PASSENGER_TOKEN;
  if (kind === 'driver') return process.env.BOT_DRIVER_TOKEN;
  if (kind === 'admin') return process.env.BOT_ADMIN_TOKEN;
  return null;
}

// WebApp login
// POST /api/auth/webapp?bot=passenger|driver
router.post('/webapp', async (req, res) => {
  const bot = String(req.query.bot || 'passenger');
  const token = botTokenFor(bot);
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData;

  const v = verifyTelegramInitData(String(initData || ''), token);
  if (!v.ok) return res.status(401).json({ error: 'bad_init_data', reason: v.reason });
  if (!v.user?.id) return res.status(400).json({ error: 'no_user' });

  const role = bot === 'driver' ? 'DRIVER' : 'PASSENGER';

  const telegramId = String(v.user.id);
  const firstName = v.user.first_name || 'User';
  const lastName = v.user.last_name || '';

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { firstName, lastName, role },
    create: { telegramId, firstName, lastName, role }
  });

  const jwtToken = jwt.sign(
    { uid: user.id, telegramId: user.telegramId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token: jwtToken, user });
});

export default router;
