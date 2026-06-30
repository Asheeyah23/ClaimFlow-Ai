const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'claimflow-dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

module.exports = { signToken, authRequired, JWT_SECRET };
