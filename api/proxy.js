// api/proxy.js
// Vercel Serverless Function — CORS Proxy ke Magnific API
// Pakai CommonJS (module.exports) agar kompatibel dengan Vercel Node.js runtime

module.exports = async function handler(req, res) {
  // ── CORS Headers ──────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-magnific-api-key');

  // Handle preflight (browser kirim OPTIONS dulu sebelum POST)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Validasi ──────────────────────────────────────────────
  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Parameter "path" wajib diisi' });
  }

  const apiKey = req.headers['x-magnific-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Header x-magnific-api-key tidak ada' });
  }

  // ── Forward ke Magnific API ────────────────────────────────
  const targetUrl = `https://api.magnific.com/v1/ai${path}`;
  console.log(`[proxy] ${req.method} ${targetUrl}`);

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-magnific-api-key': apiKey,
      },
    };

    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const data = await upstream.json();

    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('[proxy] error:', err);
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};
