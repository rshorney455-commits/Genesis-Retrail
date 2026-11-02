// Server-side proxy for Google Places Nearby Search.
// The API key lives only in the Vercel environment variable GOOGLE_MAPS_KEY,
// so it is never shipped to the browser or stored in the repository.

const ALLOWED_TYPES = new Set([
  'convenience_store',
  'supermarket',
  'grocery_or_supermarket',
  'liquor_store',
  'gas_station',
]);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GKEY = process.env.GOOGLE_MAPS_KEY;
  if (!GKEY) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_KEY is not set on the server' });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const type = String(req.query.type || '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'lat and lng must be valid numbers' });
  }
  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ error: 'Unsupported place type' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=804&type=${encodeURIComponent(type)}&key=${GKEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Places API request failed' });
  }
};
