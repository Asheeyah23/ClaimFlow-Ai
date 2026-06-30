const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

// List policyholders (optional search)
router.get('/', (req, res) => {
  const { search, limit } = req.query;
  const max = Math.min(parseInt(limit) || 100, 500);

  let rows;
  if (search) {
    const q = `%${String(search).toLowerCase()}%`;
    rows = db
      .prepare(
        `SELECT * FROM policyholders
         WHERE lower(full_name) LIKE ? OR lower(policy_number) LIKE ? OR lower(phone) LIKE ? OR lower(email) LIKE ?
         ORDER BY full_name LIMIT ?`
      )
      .all(q, q, q, q, max);
  } else {
    rows = db.prepare('SELECT * FROM policyholders ORDER BY full_name LIMIT ?').all(max);
  }

  res.json({ policyholders: rows, total: rows.length });
});

// Single policyholder + their claims history
router.get('/:id', (req, res) => {
  const policyholder = db.prepare('SELECT * FROM policyholders WHERE id = ?').get(req.params.id);
  if (!policyholder) return res.status(404).json({ error: 'Policyholder not found.' });

  const claims = db
    .prepare(
      `SELECT c.*, p.full_name AS policyholder_name, p.policy_number, p.policy_type
       FROM claims c JOIN policyholders p ON p.id = c.policyholder_id
       WHERE c.policyholder_id = ? ORDER BY c.created_at DESC`
    )
    .all(req.params.id);

  res.json({ policyholder, claims });
});

// Create policyholder
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.full_name || !b.policy_number) {
    return res.status(400).json({ error: 'Full name and policy number are required.' });
  }
  const exists = db.prepare('SELECT id FROM policyholders WHERE policy_number = ?').get(b.policy_number);
  if (exists) return res.status(409).json({ error: 'A policyholder with that policy number already exists.' });

  const ph = {
    id: crypto.randomUUID(),
    full_name: b.full_name,
    email: b.email || null,
    phone: b.phone || null,
    policy_number: b.policy_number,
    policy_type: b.policy_type || null,
    policy_start_date: b.policy_start_date || null,
    policy_end_date: b.policy_end_date || null,
    coverage_amount: b.coverage_amount != null ? Number(b.coverage_amount) : null,
    premium_amount: b.premium_amount != null ? Number(b.premium_amount) : null,
    address: b.address || null,
    state: b.state || null,
    country: b.country || 'Nigeria',
  };

  db.prepare(
    `INSERT INTO policyholders
     (id, full_name, email, phone, policy_number, policy_type, policy_start_date, policy_end_date,
      coverage_amount, premium_amount, address, state, country)
     VALUES (@id, @full_name, @email, @phone, @policy_number, @policy_type, @policy_start_date, @policy_end_date,
      @coverage_amount, @premium_amount, @address, @state, @country)`
  ).run(ph);

  res.status(201).json({ policyholder: ph });
});

module.exports = router;
