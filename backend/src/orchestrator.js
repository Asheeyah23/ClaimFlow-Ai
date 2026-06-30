/**
 * UiPath Orchestrator integration.
 *
 * Triggers a Maestro / Orchestrator process (job) when a claim is submitted, passing the
 * claim payload as InputArguments. Implements the OAuth client-credentials flow against
 * UiPath's identity server and the OData StartJobs endpoint.
 *
 * Fully optional and env-gated: if the required variables are not set, every function is a
 * safe no-op so the rest of the backend works unchanged.
 *
 * Required env to enable:
 *   UIPATH_ACCOUNT         accountLogicalName  (e.g. hackathon26_1006)
 *   UIPATH_TENANT          tenantName          (e.g. DefaultTenant)
 *   UIPATH_CLIENT_ID       External App client id
 *   UIPATH_CLIENT_SECRET   External App client secret
 *   UIPATH_FOLDER_ID       Organization Unit (Folder) id
 *   UIPATH_RELEASE_NAME    Process / Release name to start
 * Optional:
 *   UIPATH_BASE_URL        default https://cloud.uipath.com  (use https://staging.uipath.com for staging)
 *   UIPATH_SCOPE           default OR.Jobs
 *   UIPATH_STRATEGY        default ModernJobsCount
 *   UIPATH_TIMEOUT_MS      default 9000
 */

const BASE_URL = (process.env.UIPATH_BASE_URL || 'https://cloud.uipath.com').replace(/\/$/, '');
const ACCOUNT = process.env.UIPATH_ACCOUNT;
const TENANT = process.env.UIPATH_TENANT;
const CLIENT_ID = process.env.UIPATH_CLIENT_ID;
const CLIENT_SECRET = process.env.UIPATH_CLIENT_SECRET;
const FOLDER_ID = process.env.UIPATH_FOLDER_ID;
const RELEASE_NAME = process.env.UIPATH_RELEASE_NAME;
const SCOPE = process.env.UIPATH_SCOPE || 'OR.Jobs';
const STRATEGY = process.env.UIPATH_STRATEGY || 'ModernJobsCount';
const TIMEOUT_MS = parseInt(process.env.UIPATH_TIMEOUT_MS) || 9000;

function isConfigured() {
  return Boolean(ACCOUNT && TENANT && CLIENT_ID && CLIENT_SECRET && FOLDER_ID && RELEASE_NAME);
}

function status() {
  return {
    configured: isConfigured(),
    base_url: BASE_URL,
    account: ACCOUNT || null,
    tenant: TENANT || null,
    release: RELEASE_NAME || null,
    folder_id: FOLDER_ID || null,
  };
}

// ---- token cache ----
let cachedToken = null; // { token, expiresAt }

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const res = await fetchWithTimeout(`${BASE_URL}/identity_/connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: SCOPE,
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Identity token request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

/**
 * Start an Orchestrator job for a claim.
 * @returns {Promise<{dispatched: boolean, skipped?: boolean, jobId?: string|number, jobKey?: string, error?: string}>}
 */
async function startClaimJob({ claim, policyholder, analysis }) {
  if (!isConfigured()) return { dispatched: false, skipped: true };

  const inputArguments = JSON.stringify({
    claimId: claim.id,
    claimNumber: claim.claim_number,
    claimType: claim.claim_type,
    claimedAmount: claim.claimed_amount,
    incidentDate: claim.incident_date,
    incidentDescription: claim.incident_description,
    submissionChannel: claim.submission_channel,
    fraudScore: analysis?.fraud_score ?? claim.fraud_score,
    riskLevel: analysis?.risk_level ?? claim.risk_level,
    recommendation: analysis?.recommendation ?? claim.ai_recommendation,
    policyholder: policyholder
      ? {
          id: policyholder.id,
          name: policyholder.full_name,
          policyNumber: policyholder.policy_number,
          policyType: policyholder.policy_type,
          coverageAmount: policyholder.coverage_amount,
          email: policyholder.email,
          phone: policyholder.phone,
        }
      : null,
  });

  const token = await getToken();
  const url = `${BASE_URL}/${ACCOUNT}/${TENANT}/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'X-UIPATH-OrganizationUnitId': String(FOLDER_ID),
    },
    body: JSON.stringify({
      startInfo: {
        ReleaseName: RELEASE_NAME,
        Strategy: STRATEGY,
        JobsCount: 1,
        InputArguments: inputArguments,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`StartJobs failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json().catch(() => ({}));
  const job = Array.isArray(data.value) ? data.value[0] : null;
  return { dispatched: true, jobId: job?.Id, jobKey: job?.Key };
}

module.exports = { startClaimJob, isConfigured, status };
