import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import ridesRoutes from './routes/rides.js';
import topupRoutes from './routes/topup.js';
import adminRoutes from './routes/admin.js';
import { startBots } from './bots/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Static
const publicDir = path.resolve('public');
app.use('/', express.static(publicDir));
app.use('/uploads', express.static(path.resolve('uploads')));

// APIs
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`PayTaksi server listening on :${port}`);
  startBots();
});
