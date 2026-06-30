require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db, init } = require('./db');
const { heuristicAnalysis } = require('./fraud');

const uuid = () => crypto.randomUUID();
const iso = (d) => new Date(d).toISOString();
const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const USERS = [
  { name: 'Aisha Bello', email: 'aisha@claimflow.ai', password: 'ClaimFlow2026!', role: 'admin' },
  { name: 'Tunde Okafor', email: 'tunde@claimflow.ai', password: 'ClaimFlow2026!', role: 'adjuster' },
  { name: 'Ngozi Eze', email: 'ngozi@claimflow.ai', password: 'ClaimFlow2026!', role: 'supervisor' },
];

const POLICYHOLDERS = [
  { full_name: 'Chinedu Okeke', policy_type: 'Auto Insurance', coverage: 5000000, premium: 180000, state: 'Lagos', startDaysAgo: 200, phone: '+234 803 111 2233', email: 'chinedu.okeke@example.com' },
  { full_name: 'Fatima Abubakar', policy_type: 'Health Insurance', coverage: 3000000, premium: 240000, state: 'Kano', startDaysAgo: 300, phone: '+234 805 222 3344', email: 'fatima.a@example.com' },
  { full_name: 'Emeka Nwosu', policy_type: 'Property Insurance', coverage: 12000000, premium: 360000, state: 'Anambra', startDaysAgo: 200, phone: '+234 807 333 4455', email: 'emeka.nwosu@example.com' },
  { full_name: 'Blessing Adeyemi', policy_type: 'Auto Insurance', coverage: 4000000, premium: 150000, state: 'Oyo', startDaysAgo: 95, phone: '+234 809 444 5566', email: 'blessing.a@example.com' },
  { full_name: 'Ibrahim Sani', policy_type: 'Property Insurance', coverage: 8000000, premium: 300000, state: 'Kaduna', startDaysAgo: 260, phone: '+234 802 555 6677', email: 'ibrahim.sani@example.com' },
  { full_name: 'Grace Effiong', policy_type: 'Health Insurance', coverage: 2500000, premium: 200000, state: 'Akwa Ibom', startDaysAgo: 160, phone: '+234 806 666 7788', email: 'grace.effiong@example.com' },
  { full_name: 'Yusuf Mohammed', policy_type: 'Life Insurance', coverage: 15000000, premium: 420000, state: 'Abuja', startDaysAgo: 320, phone: '+234 808 777 8899', email: 'yusuf.m@example.com' },
  { full_name: 'Adaeze Okonkwo', policy_type: 'Travel Insurance', coverage: 1800000, premium: 90000, state: 'Enugu', startDaysAgo: 40, phone: '+234 810 888 9900', email: 'adaeze.o@example.com' },
  { full_name: 'Segun Olatunji', policy_type: 'Auto Insurance', coverage: 6000000, premium: 220000, state: 'Lagos', startDaysAgo: 12, phone: '+234 811 999 0011', email: 'segun.o@example.com' },
  { full_name: 'Hauwa Garba', policy_type: 'Property Insurance', coverage: 9500000, premium: 340000, state: 'Borno', startDaysAgo: 380, phone: '+234 812 010 1122', email: 'hauwa.garba@example.com' },
];

// Claim scenarios. amountPct = fraction of coverage. incidentDaysAgo relative to today.
const CLAIM_SPECS = [
  { ph: 0, type: 'Auto Accident', amountPct: 0.18, incidentDaysAgo: 35, status: 'paid', channel: 'web',
    desc: 'Rear-ended at a traffic stop on Lekki-Epe expressway. Bumper and tail-light damage, police report filed the same day with photographs of both vehicles.' },
  { ph: 0, type: 'Auto Accident', amountPct: 0.1, incidentDaysAgo: 8, status: 'approved', channel: 'mobile',
    desc: 'Minor side-mirror and door scrape in a car park. Dashcam footage and three photos attached showing the scratch and the other driver details.' },
  { ph: 1, type: 'Medical Hospitalization', amountPct: 0.4, incidentDaysAgo: 22, status: 'under_review', channel: 'whatsapp',
    desc: 'Five-day admission for malaria complications at Aminu Kano Teaching Hospital. Discharge summary, itemised bill and prescriptions submitted.' },
  { ph: 1, type: 'Outpatient Consultation', amountPct: 0.05, incidentDaysAgo: 50, status: 'paid', channel: 'whatsapp',
    desc: 'Routine specialist consultation and lab tests following recurring migraines. Receipts and referral letter attached.' },
  { ph: 2, type: 'Property Damage - Flood', amountPct: 0.35, incidentDaysAgo: 18, status: 'approved', channel: 'web',
    desc: 'Flooding after three days of heavy rain damaged ground-floor furniture, flooring and electrical fittings. Photos, repair estimate and a meteorological note included.' },
  { ph: 2, type: 'Property Theft', amountPct: 0.96, incidentDaysAgo: 5, status: 'fraud_investigation', channel: 'agent',
    desc: 'Break-in, items missing.' },
  { ph: 3, type: 'Auto Theft', amountPct: 0.98, incidentDaysAgo: 6, status: 'fraud_investigation', channel: 'web',
    desc: 'Car stolen overnight.' },
  { ph: 3, type: 'Auto Accident', amountPct: 0.22, incidentDaysAgo: 60, status: 'partially_approved', channel: 'mobile',
    desc: 'Collision at a roundabout causing front fender and headlight damage. Submitted late due to travel; police report and garage quote provided.' },
  { ph: 4, type: 'Property Damage - Fire', amountPct: 0.55, incidentDaysAgo: 28, status: 'under_review', channel: 'web',
    desc: 'Electrical fire in the kitchen damaged cabinets, wiring and the ceiling. Fire service report, photographs and a contractor estimate attached.' },
  { ph: 4, type: 'Property Theft', amountPct: 0.3, incidentDaysAgo: 70, status: 'paid', channel: 'agent',
    desc: 'Tools and equipment stolen from a locked storeroom. Inventory list, receipts for original purchases and a police report submitted.' },
  { ph: 5, type: 'Medical Hospitalization', amountPct: 0.6, incidentDaysAgo: 14, status: 'under_review', channel: 'whatsapp',
    desc: 'Emergency appendectomy with three nights admission. Full hospital bill, surgeon notes and discharge summary included.' },
  { ph: 6, type: 'Life Insurance', amountPct: 0.2, incidentDaysAgo: 40, status: 'approved', channel: 'agent',
    desc: 'Critical-illness benefit claim supported by oncologist diagnosis, pathology reports and treatment plan documentation.' },
  { ph: 7, type: 'Travel Insurance', amountPct: 0.12, incidentDaysAgo: 3, status: 'submitted', channel: 'mobile',
    desc: 'Trip cancellation due to a sudden flight grounding. Airline cancellation notice, original booking and non-refundable hotel receipts attached.' },
  { ph: 7, type: 'Travel Insurance', amountPct: 1.05, incidentDaysAgo: 2, status: 'fraud_investigation', channel: 'web',
    desc: 'Lost luggage claim.' },
  { ph: 8, type: 'Auto Theft', amountPct: 0.9, incidentDaysAgo: 4, status: 'fraud_investigation', channel: 'web',
    desc: 'Vehicle stolen.' },
  { ph: 9, type: 'Property Damage - Flood', amountPct: 0.28, incidentDaysAgo: 25, status: 'approved', channel: 'web',
    desc: 'Storm and flood water entered the compound damaging the generator house and stored goods. Photos, receipts and a repair quotation submitted.' },
  { ph: 9, type: 'Property Damage - Fire', amountPct: 1.15, incidentDaysAgo: 9, status: 'rejected', channel: 'agent',
    desc: 'Fire claim for amount above the insured value.' },
  { ph: 0, type: 'Auto Accident', amountPct: 0.1, incidentDaysAgo: 9, status: 'submitted', channel: 'mobile',
    desc: 'Small parking collision, minor scratch on the rear door. Two photos and the other party contact details attached for review.' },
  { ph: 5, type: 'Outpatient Consultation', amountPct: 0.08, incidentDaysAgo: 33, status: 'paid', channel: 'whatsapp',
    desc: 'Physiotherapy sessions following a sports injury. Therapist invoices and referral attached.' },
  { ph: 6, type: 'Medical Hospitalization', amountPct: 0.33, incidentDaysAgo: 55, status: 'partially_approved', channel: 'web',
    desc: 'Admission for hypertension management over four days. Itemised bill, consultant notes and medication list submitted for review.' },
];

function runSeed() {
  init();

  // Reset
  for (const t of ['audit_log', 'evidence', 'fraud_flags', 'claims', 'policyholders', 'users']) {
    db.prepare(`DELETE FROM ${t}`).run();
  }

  // Users
  const userIds = [];
  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  );
  for (const u of USERS) {
    const id = uuid();
    userIds.push(id);
    insertUser.run(id, u.name, u.email.toLowerCase(), bcrypt.hashSync(u.password, 10), u.role);
  }

  // Policyholders
  const phIds = [];
  const insertPh = db.prepare(
    `INSERT INTO policyholders
     (id, full_name, email, phone, policy_number, policy_type, policy_start_date, policy_end_date,
      coverage_amount, premium_amount, address, state, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  POLICYHOLDERS.forEach((p, i) => {
    const id = uuid();
    phIds.push(id);
    const start = daysAgo(p.startDaysAgo);
    const end = new Date(start.getTime() + 365 * 86400000);
    const policyNo = `POL-${p.policy_type.split(' ')[0].toUpperCase().slice(0, 4)}-${String(1000 + i)}`;
    insertPh.run(
      id, p.full_name, p.email, p.phone, policyNo, p.policy_type, ymd(start), ymd(end),
      p.coverage, p.premium, `${p.state}, Nigeria`, p.state, 'Nigeria'
    );
  });

  // Claims
  const insertClaim = db.prepare(
    `INSERT INTO claims
     (id, claim_number, policyholder_id, adjuster_id, claim_type, status, risk_level, claimed_amount,
      approved_amount, fraud_score, ai_recommendation, ai_summary, incident_date, incident_description,
      submission_channel, created_at, updated_at)
     VALUES (@id, @claim_number, @policyholder_id, @adjuster_id, @claim_type, @status, @risk_level, @claimed_amount,
      @approved_amount, @fraud_score, @ai_recommendation, @ai_summary, @incident_date, @incident_description,
      @submission_channel, @created_at, @updated_at)`
  );
  const insertFlag = db.prepare(
    'INSERT INTO fraud_flags (id, claim_id, flag_type, description, severity, detected_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertEvidence = db.prepare(
    'INSERT INTO evidence (id, claim_id, file_name, file_type, file_url, evidence_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAudit = db.prepare(
    `INSERT INTO audit_log (id, claim_id, performed_by, performed_by_name, action, old_status, new_status, notes, performed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  CLAIM_SPECS.forEach((spec, i) => {
    const ph = POLICYHOLDERS[spec.ph];
    const phId = phIds[spec.ph];
    const policyholder = db.prepare('SELECT * FROM policyholders WHERE id = ?').get(phId);

    const createdAt = daysAgo(spec.incidentDaysAgo - 1 + Math.random()); // reported ~1 day after incident
    const incidentDate = ymd(daysAgo(spec.incidentDaysAgo));
    const amount = Math.round((ph.coverage * spec.amountPct) / 1000) * 1000;

    const claim = {
      id: uuid(),
      claim_number: `CLM-2026-${String(i + 1).padStart(5, '0')}`,
      policyholder_id: phId,
      adjuster_id: null,
      claim_type: spec.type,
      status: spec.status,
      risk_level: 'pending',
      claimed_amount: amount,
      approved_amount: null,
      fraud_score: null,
      ai_recommendation: null,
      ai_summary: null,
      incident_date: incidentDate,
      incident_description: spec.desc,
      submission_channel: spec.channel,
      created_at: iso(createdAt),
      updated_at: iso(createdAt),
    };

    // Run the heuristic agent against prior claims for this policyholder
    const recent = db
      .prepare('SELECT * FROM claims WHERE policyholder_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(phId);
    const analysis = heuristicAnalysis(claim, policyholder, recent);

    claim.fraud_score = analysis.fraud_score;
    claim.risk_level = analysis.risk_level;
    claim.ai_recommendation = analysis.recommendation;
    claim.ai_summary = analysis.summary;

    // Resolve approved amounts for settled statuses
    if (spec.status === 'approved' || spec.status === 'paid') claim.approved_amount = amount;
    else if (spec.status === 'partially_approved') claim.approved_amount = Math.round(amount * 0.7);
    else if (spec.status === 'rejected') claim.approved_amount = 0;
    if (['under_review', 'approved', 'partially_approved', 'rejected', 'paid', 'fraud_investigation'].includes(spec.status)) {
      claim.adjuster_id = userIds[1 + (i % 2)];
    }

    insertClaim.run(claim);

    // Flags
    for (const f of analysis.flags) {
      insertFlag.run(uuid(), claim.id, f.flag_type, f.description, f.severity, iso(createdAt));
    }

    // Evidence — a couple of plausible items per claim
    const evidenceSets = {
      Auto: ['vehicle_front.jpg', 'police_report.pdf', 'damage_estimate.pdf'],
      Property: ['site_photo_1.jpg', 'repair_quote.pdf', 'inventory.xlsx'],
      Medical: ['discharge_summary.pdf', 'hospital_bill.pdf'],
      Outpatient: ['receipt.pdf', 'referral_letter.pdf'],
      Life: ['diagnosis_report.pdf', 'pathology.pdf'],
      Travel: ['cancellation_notice.pdf', 'booking_receipt.pdf'],
    };
    const key = Object.keys(evidenceSets).find((k) => spec.type.includes(k)) || 'Property';
    evidenceSets[key].forEach((fname) => {
      const ext = fname.split('.').pop();
      insertEvidence.run(
        uuid(), claim.id, fname, ext, `https://files.claimflow.ai/${claim.claim_number}/${fname}`,
        ext === 'pdf' || ext === 'xlsx' ? 'document' : 'image', iso(createdAt)
      );
    });

    // Audit trail
    insertAudit.run(uuid(), claim.id, userIds[0], 'Customer Portal', 'claim_submitted', null, 'submitted',
      `Submitted via ${spec.channel}.`, iso(createdAt));
    insertAudit.run(uuid(), claim.id, null, 'Fraud Agent', 'ai_analysis', 'submitted',
      analysis.recommendation === 'escalate' ? 'fraud_investigation' : analysis.recommendation === 'human_review' ? 'under_review' : 'approved',
      `Fraud score ${analysis.fraud_score} (${analysis.risk_level} risk) → ${analysis.recommendation.replace(/_/g, ' ')}.`,
      iso(new Date(createdAt.getTime() + 4000)));
    if (spec.status !== 'submitted' && spec.status !== 'fraud_investigation' && spec.status !== 'under_review') {
      insertAudit.run(uuid(), claim.id, userIds[1 + (i % 2)], USERS[1 + (i % 2)].name, 'status_change',
        'under_review', spec.status, `Adjudicated by ${USERS[1 + (i % 2)].name}.`,
        iso(new Date(createdAt.getTime() + 2 * 86400000)));
    }
  });

  const counts = {
    users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
    policyholders: db.prepare('SELECT COUNT(*) n FROM policyholders').get().n,
    claims: db.prepare('SELECT COUNT(*) n FROM claims').get().n,
    flags: db.prepare('SELECT COUNT(*) n FROM fraud_flags').get().n,
  };
  console.log('[seed] done:', counts);
  return counts;
}

module.exports = { runSeed };

// Allow `npm run seed`
if (require.main === module) {
  runSeed();
  process.exit(0);
}
