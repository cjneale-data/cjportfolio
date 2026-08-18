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

## Known follow-ups (not blocking, just noted)

- The header/hero photo is hotlinked from a LinkedIn CDN URL with an expiring signed token — it will eventually break. Worth replacing with a self-hosted image at some point.
- Chat responses are non-streaming (single JSON reply) for simplicity. Streaming (SSE) would make the widget feel snappier and is a reasonable next enhancement.
- Retrieval is TF-IDF (sparse vectors) over a hand-chunked markdown doc, not dense embeddings against a real vector DB — the right call at this corpus size (zero extra API dependency), but the first thing to swap out at production scale/variety. See the "Resume Chat" case study on the site for the full tradeoff.
