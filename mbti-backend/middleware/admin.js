const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi.' });
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan.' });
  }
  const user = db.prepare('SELECT is_admin, username FROM users WHERE id = ?').get(payload.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: "Bu bo'lim faqat administratorlar uchun." });
  }
  req.userId = payload.userId;
  req.username = user.username;
  next();
}

module.exports = { requireAdmin };
