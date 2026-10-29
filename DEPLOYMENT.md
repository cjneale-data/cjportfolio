# Deployment

## Architecture

This repo is one Vercel project: the static portfolio site (`index.html`, `player.html`, `project.html`) plus one Node serverless function (`api/chat.js`) that proxies chat requests to OpenRouter. No build step, no framework, no database — the function holds `OPENROUTER_API_KEY` server-side so it's never exposed to the browser.

Why this over the originally-sketched Vercel+Render+Streamlit-Cloud spread: the site itself needs nothing beyond static hosting plus one API route, so a single Vercel project covers it with no extra always-on service to pay for or maintain. PodFlow and Recipe Wiz have real backend/runtime needs of their own and are deployed separately — see "Deferred" below.

This repo was created fresh (`C:\Users\seejn\portfolio-site`), separate from `C:\Users\seejn\podcasts`, which still holds the original copies of these files plus ~10GB of model weights, audio, and datasets that must never enter version control. `podcasts/` was intentionally **not** git-initialized as part of this pass.

## Go live (steps only you can do — they need your accounts)

1. Create a new GitHub repo (e.g. `portfolio-site`) and push this local repo to it:
   ```
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. In the [Vercel dashboard](https://vercel.com/new), import that GitHub repo. Framework preset: "Other" (no build command needed).
3. Under Project Settings → Environment Variables, add:
   - `OPENROUTER_API_KEY` — your key from https://openrouter.ai/keys
   - `OPENROUTER_MODEL` — optional, defaults to `openai/gpt-4o-mini`
   - `SITE_URL` — your production URL once you know it (e.g. `https://portfolio-site.vercel.app`)
4. Deploy. Vercel auto-detects `api/chat.js` as a serverless function at `/api/chat`.
5. Visit the deployed URL and test the "Ask about Chris" chat widget.

## Local testing

```
npm install -g vercel   # one-time, if you don't have it
cp .env.local.example .env.local   # then fill in OPENROUTER_API_KEY
vercel dev
```
`vercel dev` serves the static files and runs `api/chat.js` locally on the same origin, so the widget works exactly as it will in production.

## Evaluation

Two offline eval harnesses back the two "case studies" that make claims about quality:

- **Resume chat** (`eval/testset.json` + `eval/run-eval.js`): ~18 cases split between factual-grounding questions (checks the reply contains the expected facts) and out-of-scope questions (checks the reply actually deflects instead of hallucinating). Run against a live server:
  ```
  vercel dev            # in one terminal
  npm run eval           # in another — defaults to http://localhost:3000
  ```
  Pass `npm run eval -- https://your-deployed-url` to score a live deployment instead of localhost. Set `DEBUG_RETRIEVAL=1` on the server to have `/api/chat` echo back which context chunks it retrieved per question, for spot-checking retrieval quality.
- **PodFlow chapter segmenter** (`C:\Users\seejn\podcasts\eval_segmenter.py`): boundary-detection precision/recall/F1 against 16 human-labeled episodes. See `podcasts/RUNBOOK.md`.

## Deferred — Phase 2 (not built in this pass)

- **Recipe Wiz** (`C:\Users\seejn\recipe_wiz`) — Streamlit app currently wired to Supabase for auth and a persistent recipe CRM. Needs the auth gate and DB layer stripped and replaced with `st.session_state` so it works as a frictionless, no-login public showcase, then a separate repo deployed to Streamlit Cloud. The LangGraph agent itself already works — see the case study on the site.

## PodFlow live data (live, on Neon)

`player.html` here previously called `http://127.0.0.1:5000/api`, which only exists on the
author's machine — the deployed "Pod Flow App" nav link was non-functional for anyone else.
Both the client and server sides are now wired to a real hosted database:

- `player.html` calls `/api` (same-origin) instead of localhost.
- `api/filter-options.js` and `api/random-chapters.js` are Vercel Node functions that port
  `podcasts/api.py`'s two read-only routes 1:1 (same SQL), reading Neon's `DATABASE_URL`
  (pooled connection string) via the `pg` package (`package.json`).
- The Postgres backing all of this is Neon project **podflow-db**
  (`shiny-breeze-95185714`, org `Christopher` / `org-super-dream-11682509`). Workspace is
  linked via the Neon CLI (`.neon`, gitignored) — see the `neon`/`neon-postgres` agent
  skills under `.agents/skills/` for the CLI/MCP workflow.
- `podcasts/.env` now points `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`/`PGPORT` at Neon's
  direct (unpooled) endpoint instead of local Postgres — so `db.py`, `api.py`,
  `check_db.py`, and `app.py`'s SQLAlchemy engine all resolved to Neon with **no code
  changes**, since psycopg2's default `sslmode=prefer` negotiates SSL automatically.
  `DATABASE_URL` in Vercel's env vars uses the separate **pooled** (`-pooler`) host, per
  Neon's guidance (pooled for serverless/web traffic, direct for migrations/session-y
  scripts).
- Existing local data (`podcasts`/`episodes`/`chapters` — care was taken to match the real
  live local schema, which had drifted from `db.py`'s stale `CREATE TABLE` statements:
  `episodes.duration` is `text` not `integer`, `transcript_json` is `jsonb`, and there's a
  `unique_episode_guid` constraint) was migrated once via `pg_dump`/`pg_restore` over the
  direct connection. `chapters2` (an empty, unused leftover table not read by any route) was
  intentionally not migrated.

The two Windows Scheduled Tasks below write through the same `.env`, so ongoing ingestion
now lands directly in Neon — local Postgres is no longer the source of truth for the
deployed site. Local `api.py` + `player.html` in `podcasts/` also now read/write Neon
directly rather than a separate local DB, so local dev and production share one dataset.

## Keeping podcast data fresh — ongoing automation

The heavy pipeline steps (`ingest_podcasts2.py`, `batch_process.py`'s faster-whisper
transcription + CNN-BiLSTM segmentation + GGUF-based enrichment) **cannot move to Vercel**:
Vercel Node functions cap out at low-single-digit-minutes execution time (even Pro/Fluid
compute), have no persistent disk to cache the ~1GB Qwen GGUF or downloaded audio between
invocations, and have no GPU/long-lived-process support — `batch_process.py` routinely runs
for minutes per episode. This isn't a config problem to work around; it's a wrong-tool-for-
the-job mismatch. Only the two cheap, stateless SQL reads above are Vercel-shaped.

So the pipeline keeps running where it runs today (the author's machine, against Postgres),
just on a schedule instead of by hand. Ranked options:

1. **Windows Task Scheduler (recommended, and now live)** — zero new infra, uses the existing
   `podcast_env` venv, works today regardless of whether the hosted-DB step above ever
   happens (point it at local or hosted Postgres via `.env`). Two tasks are registered on
   this machine (`Get-ScheduledTask -TaskName "PodFlow Ingest","PodFlow Process"` to check
   status), both set `MultipleInstances IgnoreNew` (won't stack a second run on top of one
   still in progress) and `StartWhenAvailable` (catches up if the machine was asleep at the
   scheduled time):
   ```
   PodFlow Ingest   — daily 03:00 — ingest_podcasts2.py
   PodFlow Process  — daily 04:00 — batch_process.py --days 3 (scoped, not the full backlog)
   ```
   (Stagger the start times so ingest finishes before processing starts — adjust based on
   how long a run actually takes on this machine.) Downside: only runs when the machine is
   on and awake; if that matters, use a Wake Timer in Task Scheduler's task settings
   ("Wake the computer to run this task").
2. **Small always-on Linux VPS + cron** — same scripts, `cron` instead of Task Scheduler,
   doesn't depend on a personal machine being on. Real dollar cost (~$5-6/mo, e.g.
   DigitalOcean/Linode droplet) and now something to patch/maintain — worth it only if
   reliability independent of your laptop matters more than the extra upkeep.
3. **GitHub Actions scheduled workflow** — technically possible (`on: schedule` cron
   trigger) but a poor fit here: free-tier runners are ephemeral (no disk cache for the
   ~1GB GGUF between runs, meaning a slow re-download every trigger), have no GPU, and
   `faster-whisper` + `llama-cpp-python` compiled dependencies make cold-start setup slow
   on every run. Usable only if the model weights get hosted somewhere Actions can pull
   quickly and you're fine with multi-minute job times inside the free minutes quota.

**Bottom line: yes, scheduling a job yourself (option 1) is the right move** — it's not a
fallback to settle for, it's the actual best fit for this workload. Vercel is correctly
scoped to the static site + cheap API reads; the ingestion/processing pipeline belongs on a
schedule wherever Postgres is reachable from, which today is your own machine.

## Known follow-ups (not blocking, just noted)

- The header/hero photo is hotlinked from a LinkedIn CDN URL with an expiring signed token — it will eventually break. Worth replacing with a self-hosted image at some point.
- Chat responses are non-streaming (single JSON reply) for simplicity. Streaming (SSE) would make the widget feel snappier and is a reasonable next enhancement.
- Retrieval is TF-IDF (sparse vectors) over a hand-chunked markdown doc, not dense embeddings against a real vector DB — the right call at this corpus size (zero extra API dependency), but the first thing to swap out at production scale/variety. See the "Resume Chat" case study on the site for the full tradeoff.

## Attribution Lab (first-party tracking)

`track.js` (loaded by `index.html` and `for.html`) sends events to `api/track.js`, which validates them
against the taxonomy in `lib/events.js` and writes to a `site_events` table on the same Neon
`DATABASE_URL`. The table is created lazily on first write (`CREATE TABLE IF NOT EXISTS`).
Events from `localhost` are logged to the console instead of being sent.

`api/attribution.js` serves `?view=attribution|campaigns|quality|export` and requires
`STATS_TOKEN` (Vercel env var) as a `Bearer` header or `?token=`. Without it the endpoint returns 503.

## Per-application pages (`/for/<slug>`)

`vercel.json` rewrites `/for/:slug` → `for.html`, which renders `jobs/<slug>.json`. Pages are
`noindex` and slugs carry a random suffix. Private fit notes live in `applications/` (gitignored).
Each page links a tailored resume, `resumes/<slug>.pdf`, built with its `.docx` by
`scripts/build-resume.js` from `content/resume.json` (base facts) plus the job file's `resume` block.
The PDF step needs LibreOffice locally (`SOFFICE` env var overrides the path).

```
npm run job -- new "<Company>" "<Role>" <job-url>   # scaffold + print recruiter link
npm run resume -- <slug>                           # build resumes/<slug>.docx + .pdf (--all for every job)
npm run job -- check                               # validate every jobs/*.json
npm run job -- list                                # recruiter links
```

Workflow details: `.claude/skills/tailor-job/SKILL.md`. Per-application visits:
`/api/attribution?view=campaigns&token=…` (campaign = slug).
