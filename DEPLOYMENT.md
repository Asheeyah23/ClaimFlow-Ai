# Deploying ClaimFlow AI

Two pieces, deployed separately:

- **Backend** (Node/Express + SQLite) → **Render** (needs a persistent disk for the DB file)
- **Frontend** (Next.js 14) → **Vercel**

Deploy the backend first so you have its URL to give the frontend.

---

## 1. Backend → Render

The API uses `better-sqlite3`, which writes to a file on disk. Render's persistent
disk keeps that file across restarts and redeploys. `backend/render.yaml` is a
Blueprint that wires this up automatically.

### Steps
1. Push this repo to GitHub (already done: `Asheeyah23/ClaimFlow-Ai`).
2. Go to [Render](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Select the repo. Render reads `backend/render.yaml` and proposes a
   `claimflow-api` web service with a 1 GB disk mounted at `/var/data`.
4. Click **Apply**. On first boot the API creates the schema and **auto-seeds**
   demo data (see the seed for the demo login).
5. When it's live, copy the URL, e.g. `https://claimflow-api.onrender.com`.
6. Verify: open `https://claimflow-api.onrender.com/api/health` → should return
   `{"status":"ok", ...}`.

### Env vars
`render.yaml` sets `DB_PATH=/var/data/claimflow.db`, generates a `JWT_SECRET`, and
sets `CORS_ORIGIN=*`. The optional `ANTHROPIC_API_KEY` and `UIPATH_*` vars are
declared with `sync:false` — fill them in the Render dashboard only if you want the
live Claude engine or UiPath orchestration. Everything works without them.

> **Free tier note:** Render's free web services do **not** support persistent
> disks. Options:
> - Use the **Starter** plan (~$7/mo) as configured — the disk persists data. *(recommended)*
> - Or, to stay free, delete the `disk:` block and change `DB_PATH` to
>   `/tmp/claimflow.db`. The app still runs and auto-seeds on every boot, but any
>   claims created at runtime are lost when the instance restarts. Fine for a demo.
>
> **Railway** is a good free-friendly alternative — it supports volumes. Add a
> volume, mount it, and set `DB_PATH` to a path inside it; use `npm start`.

### After deploy: lock down CORS (optional)
Once the frontend is on Vercel, set `CORS_ORIGIN` to your Vercel URL
(e.g. `https://claimflow.vercel.app`) instead of `*`.

---

## 2. Frontend → Vercel

The frontend reads the API base URL from `NEXT_PUBLIC_API_URL` at build time.

### Steps
1. Go to [Vercel](https://vercel.com/new) → import the same GitHub repo.
2. **Important:** set **Root Directory** to `frontend` (the repo is a monorepo with
   `frontend/` and `backend/` side by side). Vercel then auto-detects Next.js.
3. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://claimflow-api.onrender.com/api`
     (your Render URL from step 1, **with the trailing `/api`**).
4. Deploy. Vercel gives you `https://<project>.vercel.app`.

Because `NEXT_PUBLIC_*` vars are baked in at build time, if you change the API URL
later you must **redeploy** the frontend.

---

## Local development
- Backend: `cd backend && npm install && npm run dev` → `http://localhost:5000`
- Frontend: `cd frontend && npm install && npm run dev` → `http://localhost:3000`
  (defaults to the local API; copy `.env.local.example` to `.env.local` to override)

## Secrets
Never commit `backend/.env`. It's git-ignored. Set real secrets in the Render /
Vercel dashboards. `backend/.env.example` and `frontend/.env.local.example`
document every key.
