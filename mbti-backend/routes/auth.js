const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendTelegramMessage } = require('../utils/telegram');

const router = express.Router();
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function adminUsernames() {
  return (process.env.ADMIN_USERNAMES || '').split(',').map((s) => s.trim()).filter(Boolean);
}

router.post('/register', async (req, res) => {
  const { username, password, email, ref } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Foydalanuvchi nomi va parolni kiriting.' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Foydalanuvchi nomi 3-20 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lsin." });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Parol kamida 4 belgidan iborat bo'lsin." });
  }
  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email manzil noto'g'ri formatda." });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band.' });
  }

  let referredBy = null;
  if (ref && ref !== username) {
    const refUser = db.prepare('SELECT username FROM users WHERE username = ?').get(ref);
    if (refUser) referredBy = refUser.username;
  }

  const isAdmin = adminUsernames().includes(username) ? 1 : 0;
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = Date.now();

  const info = db
    .prepare(
      'INSERT INTO users (username, password_hash, email, is_admin, referred_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(username, passwordHash, email || null, isAdmin, referredBy, createdAt);

  const token = jwt.sign({ userId: info.lastInsertRowid, username }, process.env.JWT_SECRET, { expiresIn: '30d' });

  let notif = `🆕 <b>Yangi foydalanuvchi ro'yxatdan o'tdi</b>\nIsm: ${escapeHtml(username)}`;
  if (referredBy) notif += `\nTaklif qilgan: ${escapeHtml(referredBy)}`;
  notif += `\nVaqt: ${new Date(createdAt).toLocaleString('uz-UZ')}`;
  sendTelegramMessage(notif);

  res.json({ token, username });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Foydalanuvchi nomi va parolni kiriting.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'Bunday foydalanuvchi topilmadi.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Parol noto'g'ri." });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT username, email, is_admin, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Topilmadi.' });
  const referralCount = db.prepare('SELECT COUNT(*) AS c FROM users WHERE referred_by = ?').get(user.username).c;
  res.json({
    username: user.username,
    email: user.email,
    isAdmin: !!user.is_admin,
    createdAt: user.created_at,
    referralCount,
  });
});

module.exports = router;
