/**
 * ClaimFlow fraud detection engine.
 *
 * Produces a fraud score (0-100), risk level, routing recommendation, a plain-language
 * summary, and a set of fraud flags for a submitted claim.
 *
 * By default it runs a deterministic heuristic engine so the platform works with zero
 * external dependencies. If ANTHROPIC_API_KEY is set, it asks Claude to reason over the
 * same signals and uses that richer assessment, falling back to the heuristic on any error.
 */

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

function daysBetween(a, b) {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return ms / 86400000;
}

function riskFromScore(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  return 'high';
}

function recommendationFromRisk(risk) {
  if (risk === 'low') return 'auto_approve';
  if (risk === 'medium') return 'human_review';
  return 'escalate';
}

const HIGH_RISK_TYPES = ['Auto Theft', 'Property Theft', 'Property Damage - Fire', 'Life Insurance'];

/** Deterministic, explainable scoring used as the baseline and offline fallback. */
function heuristicAnalysis(claim, policyholder, recentClaims = []) {
  const flags = [];
  let score = 8; // small baseline

  const amount = Number(claim.claimed_amount) || 0;
  const coverage = Number(policyholder?.coverage_amount) || 0;

  // 1. Claim exceeds or nears policy coverage
  if (coverage > 0) {
    const ratio = amount / coverage;
    if (ratio > 1) {
      score += 45;
      flags.push({
        flag_type: 'coverage_exceeded',
        severity: 'critical',
        description: `Claimed amount (₦${amount.toLocaleString()}) exceeds policy coverage of ₦${coverage.toLocaleString()}.`,
      });
    } else if (ratio > 0.85) {
      score += 30;
      flags.push({
        flag_type: 'high_coverage_utilisation',
        severity: 'high',
        description: `Claim uses ${Math.round(ratio * 100)}% of available coverage — unusually high.`,
      });
    } else if (ratio > 0.6) {
      score += 9;
    }
  }

  // 2. Claim filed very soon after the policy started
  if (policyholder?.policy_start_date && claim.incident_date) {
    const sincePolicy = daysBetween(claim.incident_date, policyholder.policy_start_date);
    if (sincePolicy >= 0 && sincePolicy < 14) {
      score += 26;
      flags.push({
        flag_type: 'early_claim',
        severity: 'high',
        description: `Incident occurred ${Math.round(sincePolicy)} day(s) after the policy began — early-claim pattern.`,
      });
    } else if (sincePolicy < 0) {
      score += 45;
      flags.push({
        flag_type: 'policy_mismatch',
        severity: 'critical',
        description: 'Incident date precedes the policy start date — coverage was not active.',
      });
    }
  }

  // 3. Incident after policy expiry
  if (policyholder?.policy_end_date && claim.incident_date) {
    if (daysBetween(claim.incident_date, policyholder.policy_end_date) > 0) {
      score += 42;
      flags.push({
        flag_type: 'policy_expired',
        severity: 'critical',
        description: 'Incident date falls after the policy expiry date.',
      });
    }
  }

  // 4. Thin documentation / vague description
  const desc = (claim.incident_description || '').trim();
  if (desc.length < 40) {
    score += 14;
    flags.push({
      flag_type: 'insufficient_detail',
      severity: 'medium',
      description: 'Incident description is unusually brief, limiting verifiability.',
    });
  }

  // 5. Possible duplicate / repeat submission
  const dup = recentClaims.find(
    (c) =>
      c.id !== claim.id &&
      c.claim_type === claim.claim_type &&
      Math.abs((Number(c.claimed_amount) || 0) - amount) / (amount || 1) < 0.05
  );
  if (dup) {
    score += 22;
    flags.push({
      flag_type: 'duplicate_pattern',
      severity: 'high',
      description: `Closely matches an earlier ${claim.claim_type} claim (${dup.claim_number}) of a similar amount.`,
    });
  }

  // 6. Claim type base risk
  if (HIGH_RISK_TYPES.includes(claim.claim_type)) score += 9;

  // 7. Suspiciously round, large amounts
  if (amount >= 500000 && amount % 100000 === 0) {
    score += 6;
    flags.push({
      flag_type: 'round_amount',
      severity: 'low',
      description: 'Claimed amount is a large, perfectly round figure.',
    });
  }

  // 8. Late reporting
  if (claim.incident_date && claim.created_at) {
    const reportLag = daysBetween(claim.created_at, claim.incident_date);
    if (reportLag > 45) {
      score += 8;
      flags.push({
        flag_type: 'late_reporting',
        severity: 'low',
        description: `Claim reported ${Math.round(reportLag)} days after the incident.`,
      });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const risk = riskFromScore(score);
  const recommendation = recommendationFromRisk(risk);

  const summary = buildSummary({ score, risk, flags, claim, policyholder, amount, coverage });

  return { fraud_score: score, risk_level: risk, recommendation, summary, flags };
}

function buildSummary({ score, risk, flags, claim, amount, coverage }) {
  const lead =
    risk === 'low'
      ? `Low fraud risk (${score}/100). Signals are consistent with a legitimate ${claim.claim_type.toLowerCase()} claim.`
      : risk === 'medium'
      ? `Moderate fraud risk (${score}/100). The claim shows some patterns worth an adjuster's review.`
      : `High fraud risk (${score}/100). Multiple indicators suggest this ${claim.claim_type.toLowerCase()} claim should be investigated before any payout.`;

  const detail = flags.length
    ? ` Key findings: ${flags.slice(0, 3).map((f) => f.description).join(' ')}`
    : ' No anomalies were detected across coverage, timing, documentation, or duplication checks.';

  const action =
    risk === 'low'
      ? ' Recommended path: auto-adjudication for straight-through processing.'
      : risk === 'medium'
      ? ' Recommended path: route to a human adjuster for manual review.'
      : ' Recommended path: escalate to the fraud investigation team.';

  return lead + detail + action;
}

/** Optional Claude-powered assessment. */
async function claudeAnalysis(claim, policyholder, recentClaims) {
  const baseline = heuristicAnalysis(claim, policyholder, recentClaims);

  const prompt = `You are the fraud-detection agent for ClaimFlow AI, an insurance claims platform for emerging markets (amounts in Nigerian Naira, ₦).

Assess the following claim for fraud risk and return ONLY a JSON object, no prose, with this exact shape:
{"fraud_score": <integer 0-100>, "risk_level": "low"|"medium"|"high", "recommendation": "auto_approve"|"human_review"|"escalate", "summary": "<2-4 sentence plain-language explanation for a human adjuster>", "flags": [{"flag_type": "<snake_case>", "severity": "low"|"medium"|"high"|"critical", "description": "<one sentence>"}]}

Guidance: risk_level low=score<30, medium=30-59, high>=60. recommendation maps from risk: low->auto_approve, medium->human_review, high->escalate.

CLAIM
- Type: ${claim.claim_type}
- Claimed amount: ₦${Number(claim.claimed_amount).toLocaleString()}
- Incident date: ${claim.incident_date}
- Reported on: ${claim.created_at}
- Channel: ${claim.submission_channel}
- Description: ${claim.incident_description}

POLICY
- Policy type: ${policyholder?.policy_type}
- Coverage: ₦${Number(policyholder?.coverage_amount || 0).toLocaleString()}
- Premium: ₦${Number(policyholder?.premium_amount || 0).toLocaleString()}
- Policy period: ${policyholder?.policy_start_date} to ${policyholder?.policy_end_date}
- Prior claims by this policyholder: ${recentClaims.length}

Deterministic pre-screen (for reference, you may adjust): score ${baseline.fraud_score}, flags: ${baseline.flags
    .map((f) => f.flag_type)
    .join(', ') || 'none'}.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || '').join('');
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));

  const score = Math.max(0, Math.min(100, Math.round(Number(json.fraud_score))));
  const risk = json.risk_level || riskFromScore(score);
  return {
    fraud_score: score,
    risk_level: risk,
    recommendation: json.recommendation || recommendationFromRisk(risk),
    summary: json.summary || baseline.summary,
    flags: Array.isArray(json.flags) && json.flags.length ? json.flags : baseline.flags,
  };
}

async function analyzeClaim(claim, policyholder, recentClaims = []) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await claudeAnalysis(claim, policyholder, recentClaims);
    } catch (err) {
      console.warn('[fraud] Claude analysis failed, using heuristic:', err.message);
    }
  }
  return heuristicAnalysis(claim, policyholder, recentClaims);
}

module.exports = { analyzeClaim, heuristicAnalysis, riskFromScore, recommendationFromRisk };
