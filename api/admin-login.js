// Checks the portal admin PIN on the server.
// The PIN lives only in the Vercel environment variable ADMIN_PIN.

const crypto = require('crypto');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ADMIN_PIN = process.env.ADMIN_PIN;
  if (!ADMIN_PIN) {
    return res.status(500).json({ ok: false, error: 'ADMIN_PIN is not set on the server' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const pin = body && body.pin;

  if (typeof pin !== 'string' || !pin) {
    return res.status(400).json({ ok: false, error: 'PIN required' });
  }

  // Small delay to slow down guessing.
  await new Promise(r => setTimeout(r, 400));

  if (safeEqual(pin, ADMIN_PIN)) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Incorrect admin PIN.' });
};
