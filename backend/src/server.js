require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, init } = require('./db');
const { runSeed } = require('./seed');
const orchestrator = require('./orchestrator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'claimflow-api',
    ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'heuristic',
    orchestrator: orchestrator.status(),
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/policyholders', require('./routes/policyholders'));

// 404 + error handlers
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
app.use((err, req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Boot: init schema, seed on first run, then listen
init();
const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (count === 0) {
  console.log('[seed] Empty database detected — seeding demo data…');
  runSeed();
}

app.listen(PORT, () => {
  console.log(`\n  ClaimFlow API → http://localhost:${PORT}/api`);
  console.log(`  Fraud engine  → ${process.env.ANTHROPIC_API_KEY ? 'Claude (' + (process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001') + ')' : 'heuristic (set ANTHROPIC_API_KEY for live Claude)'}`);
  console.log(`  Orchestrator  → ${orchestrator.isConfigured() ? 'UiPath connected (release "' + process.env.UIPATH_RELEASE_NAME + '")' : 'not configured (set UIPATH_* to trigger Maestro jobs)'}`);
  console.log(`  Demo login    → aisha@claimflow.ai / ClaimFlow2026!\n`);
});
