const cors = require('cors');

// Only the local frontend (any port on localhost / 127.0.0.1) may call this API
const isAllowedOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// Reject requests whose Host header is not local (defends against DNS rebinding)
const requireLocalHost = (req, res, next) => {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return res.status(403).json({ error: 'Forbidden host' });
  }
  next();
};

// Browsers still send "simple" cross-site requests even when CORS headers are missing,
// so block any request that carries a foreign Origin instead of relying on CORS alone
const requireLocalOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  next();
};

const localCors = cors({ origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)) });

module.exports = { isAllowedOrigin, requireLocalHost, requireLocalOrigin, localCors };
