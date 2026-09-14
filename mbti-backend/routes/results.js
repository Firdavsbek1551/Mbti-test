const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendTelegramMessage } = require('../utils/telegram');
const { sendResultEmail } = require('../utils/mailer');

const router = express.Router();

const TYPE_NAMES = {
  ISTJ: 'Nazoratchi', ISFJ: 'Himoyachi', INFJ: 'Maslahatchi', INTJ: 'Strateg',
  ISTP: 'Ustaxonachi', ISFP: 'Rassom', INFP: 'Vositachi', INTP: 'Mantiqchi',
  ESTP: 'Tadbirkor', ESFP: 'Ijrochi', ENFP: 'Faol', ENTP: 'Bahschi',
  ESTJ: 'Boshqaruvchi', ESFJ: 'Konsul', ENFJ: 'Bosh murabbiy', ENTJ: "Qo'mondon",
};

const AXES_META = {
  EI: { leftName: 'Ekstravert', rightName: 'Introvert' },
  SN: { leftName: 'Sezuvchan', rightName: 'Intuitiv' },
  TF: { leftName: 'Mantiqiy', rightName: 'Hissiy' },
  JP: { leftName: 'Rejalashtiruvchi', rightName: 'Moslashuvchan' },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatScoresText(scores) {
  return Object.keys(AXES_META)
    .map((key) => {
      const s = scores[key];
      if (!s) return '';
      const meta = AXES_META[key];
      const winIsLeft = s.left >= s.right;
      const pct = winIsLeft ? s.leftPct : 100 - s.leftPct;
      const winName = winIsLeft ? meta.leftName : meta.rightName;
      return `${winName}: ${pct}%`;
    })
    .filter(Boolean)
    .join('\n');
}

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT type, scores, created_at FROM results WHERE user_id = ? ORDER BY created_at ASC')
    .all(req.userId);
  res.json({ results: rows.map((r) => ({ type: r.type, scores: JSON.parse(r.scores), date: r.created_at })) });
});

router.post('/', requireAuth, (req, res) => {
  const { type, scores } = req.body || {};
  if (!type || !scores) {
    return res.status(400).json({ error: "Ma'lumot to'liq emas." });
  }

  const createdAt = Date.now();
  db.prepare('INSERT INTO results (user_id, type, scores, created_at) VALUES (?, ?, ?, ?)')
    .run(req.userId, type, JSON.stringify(scores), createdAt);

  db.prepare('DELETE FROM drafts WHERE user_id = ?').run(req.userId);

  const typeName = TYPE_NAMES[type] || '';
  sendTelegramMessage(
    `📊 <b>Test yakunlandi</b>\nFoydalanuvchi: ${escapeHtml(req.username)}\nNatija: ${type} — ${typeName}\nVaqt: ${new Date(createdAt).toLocaleString('uz-UZ')}`
  );

  res.json({ ok: true });
});

router.post('/send-email', requireAuth, async (req, res) => {
  const { type, scores, email } = req.body || {};
  if (!type || !scores) {
    return res.status(400).json({ error: "Ma'lumot to'liq emas." });
  }

  let targetEmail = email;
  if (!targetEmail) {
    const row = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
    targetEmail = row && row.email;
  }
  if (!targetEmail) {
    return res.status(400).json({ error: "Email manzil kiritilmagan. Natija sahifasida email kiriting." });
  }

  const typeName = TYPE_NAMES[type] || '';
  const body = `Sizning MBTI natijangiz: ${type} — ${typeName}\n\n${formatScoresText(scores)}`;

  try {
    await sendResultEmail(targetEmail, `Sizning shaxsiyat natijangiz: ${type} — ${typeName}`, body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  res.json({ ok: true });
});

router.get('/draft', requireAuth, (req, res) => {
  const row = db.prepare('SELECT answers, question_index FROM drafts WHERE user_id = ?').get(req.userId);
  if (!row) return res.json({ draft: null });
  res.json({ draft: { answers: JSON.parse(row.answers), index: row.question_index } });
});

router.put('/draft', requireAuth, (req, res) => {
  const { answers, index } = req.body || {};
  const updatedAt = Date.now();
  db.prepare(
    `INSERT INTO drafts (user_id, answers, question_index, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET answers = excluded.answers, question_index = excluded.question_index, updated_at = excluded.updated_at`
  ).run(req.userId, JSON.stringify(answers || {}), index || 0, updatedAt);
  res.json({ ok: true });
});

module.exports = router;
