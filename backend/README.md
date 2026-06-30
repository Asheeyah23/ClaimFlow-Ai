# ClaimFlow AI — Backend

Node/Express REST API powering the ClaimFlow AI claims console: authentication, claims
lifecycle, policyholders, and the fraud-detection agent.

Uses **SQLite** (via `better-sqlite3`) so it runs with zero external services — the database
file and demo data are created automatically on first start.

## Run

```bash
cd backend
cp .env.example .env      # optional — sensible defaults are built in
npm install
npm run dev               # or: npm start
```

API: `http://localhost:5000/api` · Health: `http://localhost:5000/api/health`

The frontend defaults to this URL (`NEXT_PUBLIC_API_URL`), so just start both.

### Demo login

```
aisha@claimflow.ai / ClaimFlow2026!
```

(Also `tunde@…` adjuster and `ngozi@…` supervisor — same password.)

## Fraud engine

- **No API key** → deterministic, explainable heuristic engine (coverage ratio, claim timing,
  documentation quality, duplicate detection, policy validity, …).
- **`ANTHROPIC_API_KEY` set** → the Fraud Agent reasons with Claude and returns a score,
  recommendation, summary and flags, falling back to the heuristic on any error.

## UiPath Orchestrator / Maestro

Optional and env-gated (`src/orchestrator.js`). When the `UIPATH_*` variables are set,
**submitting a claim starts an Orchestrator job** and passes the claim payload as
`InputArguments`; otherwise claim submission behaves exactly as before.

It performs the OAuth client-credentials flow against `\{BASE_URL\}/identity_/connect/token`
(token is cached) and calls `StartJobs`:

```
POST {BASE_URL}/{ACCOUNT}/{TENANT}/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
Authorization: Bearer {token}
X-UIPATH-OrganizationUnitId: {UIPATH_FOLDER_ID}
{ "startInfo": { "ReleaseName": "...", "Strategy": "ModernJobsCount", "JobsCount": 1, "InputArguments": "{...}" } }
```

Setup:
1. Orchestrator → **Processes**: note the Release name → `UIPATH_RELEASE_NAME`; note the
   Folder (Organization Unit) id → `UIPATH_FOLDER_ID`.
2. Admin → **External Applications**: create an app with scope `OR.Jobs`, grant it the folder
   → `UIPATH_CLIENT_ID` / `UIPATH_CLIENT_SECRET`.
3. From the Orchestrator URL `https://{host}/{ACCOUNT}/{TENANT}/...` set `UIPATH_ACCOUNT`,
   `UIPATH_TENANT`, and `UIPATH_BASE_URL` (`https://staging.uipath.com` for the staging tenant).

Check wiring at `GET /api/health` (`orchestrator.configured`) and trigger manually with
`POST /api/claims/:id/orchestrate`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Email + password → JWT |
| POST | `/api/auth/register` | Create user |
| GET | `/api/auth/me` | Current user |
| GET | `/api/claims` | List (search, `status`, `risk_level`, pagination) |
| GET | `/api/claims/:id` | Claim + evidence + flags + audit log |
| POST | `/api/claims` | Create claim → runs fraud analysis |
| PATCH | `/api/claims/:id/status` | Update status / approved amount |
| POST | `/api/claims/:id/analyze` | Re-run the fraud agent |
| GET | `/api/claims/stats/dashboard` | Dashboard aggregates |
| GET | `/api/policyholders` | List (search) |
| GET | `/api/policyholders/:id` | Policyholder + claims history |
| POST | `/api/policyholders` | Create policyholder |

All `/claims` and `/policyholders` routes require `Authorization: Bearer <token>`.

## Reset demo data

```bash
npm run seed
```
