const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'claimflow.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'adjuster',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS policyholders (
      id                TEXT PRIMARY KEY,
      full_name         TEXT NOT NULL,
      email             TEXT,
      phone             TEXT,
      policy_number     TEXT NOT NULL UNIQUE,
      policy_type       TEXT,
      policy_start_date TEXT,
      policy_end_date   TEXT,
      coverage_amount   REAL,
      premium_amount    REAL,
      address           TEXT,
      state             TEXT,
      country           TEXT DEFAULT 'Nigeria',
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS claims (
      id                  TEXT PRIMARY KEY,
      claim_number        TEXT NOT NULL UNIQUE,
      policyholder_id     TEXT NOT NULL REFERENCES policyholders(id),
      adjuster_id         TEXT REFERENCES users(id),
      claim_type          TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'submitted',
      risk_level          TEXT NOT NULL DEFAULT 'pending',
      claimed_amount      REAL NOT NULL,
      approved_amount     REAL,
      fraud_score         REAL,
      ai_recommendation   TEXT,
      ai_summary          TEXT,
      incident_date       TEXT,
      incident_description TEXT,
      submission_channel  TEXT DEFAULT 'web',
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fraud_flags (
      id          TEXT PRIMARY KEY,
      claim_id    TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
      flag_type   TEXT NOT NULL,
      description TEXT,
      severity    TEXT NOT NULL DEFAULT 'medium',
      detected_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id            TEXT PRIMARY KEY,
      claim_id      TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
      file_name     TEXT NOT NULL,
      file_type     TEXT,
      file_url      TEXT,
      evidence_type TEXT,
      uploaded_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id                TEXT PRIMARY KEY,
      claim_id          TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
      performed_by      TEXT,
      performed_by_name TEXT,
      action            TEXT NOT NULL,
      old_status        TEXT,
      new_status        TEXT,
      notes             TEXT,
      performed_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
    CREATE INDEX IF NOT EXISTS idx_claims_risk ON claims(risk_level);
    CREATE INDEX IF NOT EXISTS idx_claims_ph ON claims(policyholder_id);
    CREATE INDEX IF NOT EXISTS idx_flags_claim ON fraud_flags(claim_id);
    CREATE INDEX IF NOT EXISTS idx_audit_claim ON audit_log(claim_id);
  `);
}

module.exports = { db, init, DB_PATH };
