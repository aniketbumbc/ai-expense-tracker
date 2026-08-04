import { DatabaseSync } from 'node:sqlite';

export const initDb = (dbPath) => {
  const db = new DatabaseSync(dbPath);

  // node:sqlite doesn't enforce FKs unless you turn them on
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      reset_token_hash TEXT,
      reset_token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // migrate existing databases created before email/reset columns existed
  const userCols = db
    .prepare('PRAGMA table_info(users)')
    .all()
    .map((c) => c.name);

  if (!userCols.includes('email')) {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  }
  if (!userCols.includes('reset_token_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN reset_token_hash TEXT');
  }
  if (!userCols.includes('reset_token_expires_at')) {
    db.exec('ALTER TABLE users ADD COLUMN reset_token_expires_at TEXT');
  }

  // NULL emails don't collide under a unique index, so existing rows without
  // an email are unaffected while new/updated emails stay unique
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  return db;
};
