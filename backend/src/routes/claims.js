const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authRequired } = require('../auth');
const { analyzeClaim } = require('../fraud');
const orchestrator = require('../orchestrator');

const router = express.Router();
router.use(authRequired);

const CLAIM_SELECT = `
  SELECT c.*,
         p.full_name   AS policyholder_name,
         p.policy_number,
         p.policy_type,
         u.name        AS adjuster_name
  FROM claims c
  JOIN policyholders p ON p.id = c.policyholder_id
  LEFT JOIN users u ON u.id = c.adjuster_id
`;

const CLAIM_DETAIL_SELECT = `
  SELECT c.*,
         p.full_name        AS policyholder_name,
         p.email            AS policyholder_email,
         p.phone            AS policyholder_phone,
         p.policy_number,
         p.policy_type,
         p.policy_start_date,
         p.policy_end_date,
         p.coverage_amount,
         p.premium_amount,
         p.state,
         p.country,
         u.name             AS adjuster_name,
         u.email            AS adjuster_email
  FROM claims c
  JOIN policyholders p ON p.id = c.policyholder_id
  LEFT JOIN users u ON u.id = c.adjuster_id
`;

function nextClaimNumber() {
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) AS n FROM claims WHERE claim_number LIKE ?").get(`CLM-${year}-%`).n;
  const seq = String(count + 1).padStart(5, '0');
  let number = `CLM-${year}-${seq}`;
  // guard against collisions
  while (db.prepare('SELECT 1 FROM claims WHERE claim_number = ?').get(number)) {
    number = `CLM-${year}-${String(Math.floor(10000 + Math.random() * 89999))}`;
  }
  return number;
}

function statusFromRecommendation(rec) {
  if (rec === 'escalate') return 'fraud_investigation';
  if (rec === 'human_review') return 'under_review';
  return 'approved'; // auto_approve → straight-through
}

function audit({ claim_id, performed_by, performed_by_name, action, old_status, new_status, notes }) {
  db.prepare(
    `INSERT INTO audit_log (id, claim_id, performed_by, performed_by_name, action, old_status, new_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), claim_id, performed_by || null, performed_by_name || null, action, old_status || null, new_status || null, notes || null);
}

function writeFlags(claim_id, flags = []) {
  db.prepare('DELETE FROM fraud_flags WHERE claim_id = ?').run(claim_id);
  const insert = db.prepare(
    'INSERT INTO fraud_flags (id, claim_id, flag_type, description, severity) VALUES (?, ?, ?, ?, ?)'
  );
  for (const f of flags) {
    insert.run(crypto.randomUUID(), claim_id, f.flag_type, f.description || '', f.severity || 'medium');
  }
}

/* ----------------------------- Dashboard stats ---------------------------- */
router.get('/stats/dashboard', (req, res) => {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(claimed_amount), 0)  AS total_claimed,
              COALESCE(SUM(approved_amount), 0) AS total_approved
       FROM claims`
    )
    .get();

  const by_status = db
    .prepare('SELECT status, COUNT(*) AS count FROM claims GROUP BY status ORDER BY count DESC')
    .all();
  const by_risk = db
    .prepare('SELECT risk_level, COUNT(*) AS count FROM claims GROUP BY risk_level')
    .all();
  const recent_claims = db.prepare(`${CLAIM_SELECT} ORDER BY c.created_at DESC LIMIT 6`).all();

  res.json({
    totals: {
      total: String(totals.total),
      total_claimed: String(totals.total_claimed),
      total_approved: String(totals.total_approved),
    },
    by_status: by_status.map((r) => ({ status: r.status, count: String(r.count) })),
    by_risk: by_risk.map((r) => ({ risk_level: r.risk_level, count: String(r.count) })),
    recent_claims,
  });
});

/* --------------------------------- List ----------------------------------- */
router.get('/', (req, res) => {
  const { search, status, risk_level } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  if (status) {
    where.push('c.status = ?');
    params.push(status);
  }
  if (risk_level) {
    where.push('c.risk_level = ?');
    params.push(risk_level);
  }
  if (search) {
    const q = `%${String(search).toLowerCase()}%`;
    where.push('(lower(c.claim_number) LIKE ? OR lower(p.full_name) LIKE ? OR lower(p.policy_number) LIKE ? OR lower(c.claim_type) LIKE ?)');
    params.push(q, q, q, q);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM claims c JOIN policyholders p ON p.id = c.policyholder_id ${whereSql}`)
    .get(...params).n;

  const claims = db
    .prepare(`${CLAIM_SELECT} ${whereSql} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  res.json({ claims, total, page, limit });
});

/* ------------------------------- Single claim ----------------------------- */
router.get('/:id', (req, res) => {
  const claim = db.prepare(`${CLAIM_DETAIL_SELECT} WHERE c.id = ?`).get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const evidence = db.prepare('SELECT * FROM evidence WHERE claim_id = ? ORDER BY uploaded_at').all(req.params.id);
  const fraud_flags = db.prepare('SELECT * FROM fraud_flags WHERE claim_id = ? ORDER BY detected_at').all(req.params.id);
  const audit_log = db
    .prepare('SELECT * FROM audit_log WHERE claim_id = ? ORDER BY performed_at DESC')
    .all(req.params.id);

  res.json({ claim, evidence, fraud_flags, audit_log });
});

/* --------------------------------- Create --------------------------------- */
router.post('/', async (req, res) => {
  const b = req.body || {};
  if (!b.policyholder_id || !b.claim_type || !b.incident_date || !b.incident_description || b.claimed_amount == null) {
    return res.status(400).json({ error: 'Missing required claim fields.' });
  }

  const policyholder = db.prepare('SELECT * FROM policyholders WHERE id = ?').get(b.policyholder_id);
  if (!policyholder) return res.status(400).json({ error: 'Unknown policyholder.' });

  const now = new Date().toISOString();
  const claim = {
    id: crypto.randomUUID(),
    claim_number: nextClaimNumber(),
    policyholder_id: b.policyholder_id,
    adjuster_id: null,
    claim_type: b.claim_type,
    status: 'submitted',
    risk_level: 'pending',
    claimed_amount: Number(b.claimed_amount),
    approved_amount: null,
    fraud_score: null,
    ai_recommendation: null,
    ai_summary: null,
    incident_date: b.incident_date,
    incident_description: b.incident_description,
    submission_channel: b.submission_channel || 'web',
    created_at: now,
    updated_at: now,
  };

  // Run the fraud agent over this claim
  const recent = db
    .prepare('SELECT * FROM claims WHERE policyholder_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(b.policyholder_id);
  const analysis = await analyzeClaim(claim, policyholder, recent);

  claim.fraud_score = analysis.fraud_score;
  claim.risk_level = analysis.risk_level;
  claim.ai_recommendation = analysis.recommendation;
  claim.ai_summary = analysis.summary;
  claim.status = statusFromRecommendation(analysis.recommendation);
  if (analysis.recommendation === 'auto_approve') claim.approved_amount = claim.claimed_amount;

  db.prepare(
    `INSERT INTO claims
     (id, claim_number, policyholder_id, adjuster_id, claim_type, status, risk_level, claimed_amount,
      approved_amount, fraud_score, ai_recommendation, ai_summary, incident_date, incident_description,
      submission_channel, created_at, updated_at)
     VALUES (@id, @claim_number, @policyholder_id, @adjuster_id, @claim_type, @status, @risk_level, @claimed_amount,
      @approved_amount, @fraud_score, @ai_recommendation, @ai_summary, @incident_date, @incident_description,
      @submission_channel, @created_at, @updated_at)`
  ).run(claim);

  writeFlags(claim.id, analysis.flags);

  audit({
    claim_id: claim.id,
    performed_by: req.user.id,
    performed_by_name: req.user.email,
    action: 'claim_submitted',
    new_status: 'submitted',
    notes: `Submitted via ${claim.submission_channel}.`,
  });
  audit({
    claim_id: claim.id,
    performed_by: null,
    performed_by_name: 'Fraud Agent',
    action: 'ai_analysis',
    old_status: 'submitted',
    new_status: claim.status,
    notes: `Fraud score ${claim.fraud_score} (${claim.risk_level} risk) → ${analysis.recommendation.replace(/_/g, ' ')}.`,
  });

  // Hand the claim off to UiPath Orchestrator / Maestro (no-op unless configured).
  // A dispatch failure must never fail the claim submission.
  let orchestration = { dispatched: false, skipped: true };
  try {
    orchestration = await orchestrator.startClaimJob({ claim, policyholder, analysis });
    if (orchestration.dispatched) {
      audit({
        claim_id: claim.id,
        performed_by: null,
        performed_by_name: 'Maestro Case',
        action: 'orchestrator_dispatch',
        new_status: claim.status,
        notes: `Dispatched to UiPath Orchestrator (release "${process.env.UIPATH_RELEASE_NAME}")${
          orchestration.jobId ? `, job ${orchestration.jobId}` : ''
        }.`,
      });
    }
  } catch (err) {
    console.warn('[orchestrator] dispatch failed:', err.message);
    orchestration = { dispatched: false, error: err.message };
  }

  const full = db.prepare(`${CLAIM_SELECT} WHERE c.id = ?`).get(claim.id);
  res.status(201).json({ claim: full, ai_analysis: analysis, orchestration });
});

/* ------------------------------ Update status ----------------------------- */
router.patch('/:id/status', (req, res) => {
  const { status, approved_amount, notes } = req.body || {};
  const valid = ['submitted', 'under_review', 'fraud_investigation', 'approved', 'partially_approved', 'rejected', 'paid'];
  if (!status || !valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const newApproved =
    approved_amount != null
      ? Number(approved_amount)
      : status === 'approved'
      ? claim.claimed_amount
      : status === 'rejected'
      ? 0
      : claim.approved_amount;

  db.prepare(
    `UPDATE claims SET status = ?, approved_amount = ?, adjuster_id = COALESCE(adjuster_id, ?), updated_at = datetime('now') WHERE id = ?`
  ).run(status, newApproved, req.user.id, req.params.id);

  audit({
    claim_id: req.params.id,
    performed_by: req.user.id,
    performed_by_name: req.user.email,
    action: 'status_change',
    old_status: claim.status,
    new_status: status,
    notes: notes || null,
  });

  const full = db.prepare(`${CLAIM_DETAIL_SELECT} WHERE c.id = ?`).get(req.params.id);
  res.json({ claim: full });
});

/* ------------------------------- Re-analyze ------------------------------- */
router.post('/:id/analyze', async (req, res) => {
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const policyholder = db.prepare('SELECT * FROM policyholders WHERE id = ?').get(claim.policyholder_id);
  const recent = db
    .prepare('SELECT * FROM claims WHERE policyholder_id = ? AND id != ? ORDER BY created_at DESC LIMIT 20')
    .all(claim.policyholder_id, claim.id);

  const analysis = await analyzeClaim(claim, policyholder, recent);

  db.prepare(
    `UPDATE claims SET fraud_score = ?, risk_level = ?, ai_recommendation = ?, ai_summary = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(analysis.fraud_score, analysis.risk_level, analysis.recommendation, analysis.summary, claim.id);

  writeFlags(claim.id, analysis.flags);

  audit({
    claim_id: claim.id,
    performed_by: req.user.id,
    performed_by_name: req.user.email,
    action: 're_analysis',
    notes: `Re-scored: ${analysis.fraud_score} (${analysis.risk_level} risk).`,
  });

  const full = db.prepare(`${CLAIM_DETAIL_SELECT} WHERE c.id = ?`).get(claim.id);
  res.json({ claim: full, ai_analysis: analysis });
});

/* ------------------------ Manually (re)dispatch to UiPath ------------------ */
router.post('/:id/orchestrate', async (req, res) => {
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (!orchestrator.isConfigured()) {
    return res.status(400).json({ error: 'UiPath Orchestrator is not configured on this server.', status: orchestrator.status() });
  }

  const policyholder = db.prepare('SELECT * FROM policyholders WHERE id = ?').get(claim.policyholder_id);
  try {
    const analysis = {
      fraud_score: claim.fraud_score,
      risk_level: claim.risk_level,
      recommendation: claim.ai_recommendation,
    };
    const orchestration = await orchestrator.startClaimJob({ claim, policyholder, analysis });
    if (orchestration.dispatched) {
      audit({
        claim_id: claim.id,
        performed_by: req.user.id,
        performed_by_name: req.user.email,
        action: 'orchestrator_dispatch',
        notes: `Manually dispatched to UiPath Orchestrator${orchestration.jobId ? `, job ${orchestration.jobId}` : ''}.`,
      });
    }
    res.json({ orchestration });
  } catch (err) {
    res.status(502).json({ error: 'Orchestrator dispatch failed.', detail: err.message });
  }
});

module.exports = router;
