// Competitor search via TomTom (server-side, key never sent to the browser).
// Set TOMTOM_API_KEY in Vercel → Project → Settings → Environment Variables.
// Returns a Google-Places-shaped response so existing callers keep working:
//   { results: [{ place_id, name, geometry:{location:{lat,lng}}, types:[...], brand }] }

const QUERIES = {
  convenience_store: "convenience store",
  supermarket: "supermarket",
  grocery_or_supermarket: "grocery store",
  liquor_store: "off licence",
};

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const key = process.env.TOMTOM_API_KEY;
  if (!key) return res.status(500).json({ error: "TOMTOM_API_KEY is not set on the server" });

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }
  const radius = Math.min(Math.max(parseInt(req.query.radius, 10) || 1609, 100), 5000);
  const type = req.query.type && QUERIES[req.query.type] ? req.query.type : null;
  const types = type ? [type] : Object.keys(QUERIES);

  try {
    const results = [];
    const seen = new Set();
    for (const t of types) {
      const url = "https://api.tomtom.com/search/2/categorySearch/" +
        encodeURIComponent(QUERIES[t]) + ".json" +
        `?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lng}&radius=${radius}` +
        "&limit=100&countrySet=GB";
      const r = await fetch(url);
      if (!r.ok) throw new Error("TomTom returned " + r.status);
      const data = await r.json();
      for (const p of data.results || []) {
        if (!p.poi || !p.position || seen.has(p.id)) continue;
        seen.add(p.id);
        results.push({
          place_id: p.id,
          name: p.poi.name,
          geometry: { location: { lat: p.position.lat, lng: p.position.lon } },
          types: [t],
          brand: p.poi.brands && p.poi.brands[0] ? p.poi.brands[0].name : null,
          address: p.address ? p.address.freeformAddress : null,
          distM: Math.round(p.dist || 0),
        });
      }
    }
    res.setHeader("Cache-Control", "s-maxage=86400");
    return res.status(200).json({ results });
  } catch (e) {
    return res.status(502).json({ error: "TomTom search failed", message: e.message });
  }
};
