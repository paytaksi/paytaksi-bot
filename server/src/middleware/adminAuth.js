export function requireAdminPassword(req, res, next) {
  const pass = req.headers['x-admin-password'] || req.query.password;
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD_not_set' });
  if (String(pass || '') !== String(process.env.ADMIN_PASSWORD)) return res.status(401).json({ error: 'bad_admin_password' });
  next();
}
