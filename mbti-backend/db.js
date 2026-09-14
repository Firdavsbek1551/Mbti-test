const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'mbti.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  scores TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS drafts (
  user_id INTEGER PRIMARY KEY,
  answers TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

// --- Kichik migratsiyalar: eski bazalarga yangi ustunlarni xavfsiz qo'shish ---
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('users', 'email', 'TEXT');
ensureColumn('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'referred_by', 'TEXT');

// .env dagi ADMIN_USERNAMES ro'yxatidagi foydalanuvchilarni har ishga tushishda admin qilib belgilaydi
const adminUsernames = (process.env.ADMIN_USERNAMES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (adminUsernames.length) {
  const stmt = db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?');
  adminUsernames.forEach((u) => stmt.run(u));
}

module.exports = db;
