import crypto from 'crypto';

export function calcFare(distanceKm) {
  const base = 3.50;
  const after3 = Math.max(0, distanceKm - 3);
  const fare = base + after3 * 0.40;
  // Round to 2 decimals
  return Math.round(fare * 100) / 100;
}

export function calcCommission(fareAzN) {
  const c = fareAzN * 0.10;
  return Math.round(c * 100) / 100;
}

// Telegram WebApp initData validation
// Ref: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
export function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false, reason: 'missing_initData_or_token' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'missing_hash' };

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return { ok: false, reason: 'bad_hash' };

  // Optional: check auth_date freshness (e.g. 24h)
  const authDate = Number(params.get('auth_date') || '0');
  if (authDate) {
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 60 * 60 * 24) return { ok: false, reason: 'expired_auth_date' };
  }

  const userRaw = params.get('user');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  return { ok: true, user, params: Object.fromEntries(params.entries()) };
}
