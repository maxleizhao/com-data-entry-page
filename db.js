const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Allow DATA_DIR env var for persistent storage (e.g. NFS mount)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      project TEXT NOT NULL CHECK(project IN ('baseline', 'pyrocks', 'donutech', 'sg')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS baseline_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      operator_id INTEGER NOT NULL REFERENCES operators(id),
      subject_id TEXT NOT NULL,
      height REAL NOT NULL,
      weight REAL NOT NULL,
      bmi REAL GENERATED ALWAYS AS (ROUND(weight / ((height/100.0)*(height/100.0)), 1)) STORED,
      waist_circumference REAL NOT NULL,
      hip_circumference REAL NOT NULL,
      grip_strength REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS pyrocks_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      operator_id INTEGER NOT NULL REFERENCES operators(id),
      subject_id TEXT NOT NULL,
      risk TEXT NOT NULL CHECK(risk IN ('Low', 'Moderate', 'High')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS donutech_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      operator_id INTEGER NOT NULL REFERENCES operators(id),
      subject_id TEXT NOT NULL,
      blood_pressure TEXT NOT NULL,
      heart_rate INTEGER NOT NULL,
      blood_glucose REAL NOT NULL,
      time_since_last_meal TEXT NOT NULL,
      remarks TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sg_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      operator_id INTEGER NOT NULL REFERENCES operators(id),
      serial_number TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      hba1c REAL NOT NULL,
      total_cholesterol REAL NOT NULL,
      hdl REAL NOT NULL,
      trig REAL NOT NULL,
      ldl REAL NOT NULL,
      glucose_donutech REAL NOT NULL,
      remarks TEXT DEFAULT '',
      hba1c_equip_no TEXT NOT NULL,
      cholesterol_equip_no TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_baseline_event ON baseline_records(event_id);
    CREATE INDEX IF NOT EXISTS idx_pyrocks_event ON pyrocks_records(event_id);
    CREATE INDEX IF NOT EXISTS idx_donutech_event ON donutech_records(event_id);
    CREATE INDEX IF NOT EXISTS idx_sg_event ON sg_records(event_id);
  `);
}

module.exports = { db, initialize };
