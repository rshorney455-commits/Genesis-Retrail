module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lng, type } = req.query;

  if (!lat || !lng || !type) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lng, type' });
  }

  const GKEY = 'AIzaSyB_QQUvX-Tvt5ZJD2Hj_O31wVLPQUc6k0s';
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=804&type=${encodeURIComponent(type)}&key=${GKEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Places API request failed', message: e.message });
  }
};
