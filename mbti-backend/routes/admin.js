const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.get('/users', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.created_at, u.is_admin, u.referred_by,
        (SELECT COUNT(*) FROM results r WHERE r.user_id = u.id) AS test_count,
        (SELECT type FROM results r WHERE r.user_id = u.id ORDER BY r.created_at DESC LIMIT 1) AS latest_type
       FROM users u
       ORDER BY u.created_at DESC`
    )
    .all();
  res.json({ users: rows });
});

router.get('/stats', requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalResults = db.prepare('SELECT COUNT(*) AS c FROM results').get().c;

  const typeRows = db.prepare('SELECT type, COUNT(*) AS c FROM results GROUP BY type').all();
  const typeDistribution = {};
  typeRows.forEach((r) => {
    typeDistribution[r.type] = r.c;
  });

  const topReferrers = db
    .prepare(
      `SELECT referred_by, COUNT(*) AS c FROM users
       WHERE referred_by IS NOT NULL AND referred_by != ''
       GROUP BY referred_by ORDER BY c DESC LIMIT 10`
    )
    .all();

  res.json({ totalUsers, totalResults, typeDistribution, topReferrers });
});

module.exports = router;
