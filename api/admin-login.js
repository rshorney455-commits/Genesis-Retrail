// Checks the portal admin PIN on the server so it is not visible in the page source.
// Set ADMIN_PIN in Vercel → Project → Settings → Environment Variables.
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const expected = process.env.ADMIN_PIN;
  if (!expected) return res.status(500).json({ ok: false, error: "ADMIN_PIN is not set on the server" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const given = String(body.pin || "");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  await new Promise(r => setTimeout(r, 400)); // slow down guessing
  return res.status(200).json({ ok: crypto.timingSafeEqual(a, b) });
};
