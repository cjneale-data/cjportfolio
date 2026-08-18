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

## Deferred — Phase 2 (not built in this pass)

Per the original brief's Tasks 3 and 4, scoped out for now by agreement — each needs its own repo and its own architecture decisions:

- **PodFlow** (`C:\Users\seejn\podcasts`) — Flask + Postgres + faster-whisper + llama-cpp-python pipeline with ~10GB of local GGUF model weights. Not viable on free serverless/Render tiers; plan is to get it correctly runnable self-hosted/in Docker first, with a real cloud deploy revisited later once there's a compute target (VPS/GPU box) to target.
- **Recipe Wiz** (`C:\Users\seejn\recipe_wiz`) — Streamlit app currently wired to Supabase for auth and a persistent recipe CRM. Needs the auth gate and DB layer stripped and replaced with `st.session_state` so it works as a frictionless, no-login public showcase, then a separate repo deployed to Streamlit Cloud.

## Known follow-ups (not blocking, just noted)

- The header/hero photo is hotlinked from a LinkedIn CDN URL with an expiring signed token — it will eventually break. Worth replacing with a self-hosted image at some point.
- `renderProjects()` / `renderSpecificProject()` in `index.html` are still scaffolded placeholders (pre-existing, not part of this pass) — fill in with real project cards when ready.
- Chat responses are non-streaming (single JSON reply) for simplicity. Streaming (SSE) would make the widget feel snappier and is a reasonable next enhancement.
