---
name: tailor-job
description: Build a personalized recruiter page on the portfolio site for a specific job posting. Use when Chris pastes a job link (jobright, LinkedIn, Greenhouse, Lever, Ashby, company careers page) and wants to apply, or asks to "tailor the site" / "make a page for this job".
---

# Tailor the portfolio to a job posting

Every job link Chris gives gets **all three**: a unique route, a tailored web page, and a new resume file. Don't stop until all three exist and `npm run job -- check` passes.

Each application gets an unlisted page at `/for/<slug>`, rendered by `for.html` from `jobs/<slug>.json`, plus a tailored resume at `resumes/<slug>.docx` and `.pdf` built from the same file (the page's "Resume (PDF)" button links it). The recruiter link carries `utm_source=recruiter&utm_campaign=<slug>`, so visits and contact clicks show up per application in the Attribution Lab (`/api/attribution?view=campaigns`).

## Steps

1. **Read the posting.** Fetch the job URL. Pull company, title, location/remote, comp, required vs. preferred qualifications, and named tools. If the page is behind a login, ask Chris to paste the description.
2. **Read the source of truth.** `content/career-master.md` is the exhaustive record of everything Chris has done (it also feeds the site chat). `content/resume.json` holds the resume's fixed structure (titles, dates, education, project write-ups). New facts Chris confirms go into `career-master.md` first, and also `resume.json` if they change its structure. Its HTML comments hold open TODO(Chris) questions; check them for anything relevant to this job and ask. Every claim on the page must trace to one of these. Never invent tools, titles, metrics, or employers. If the posting hinges on something Chris might have done but the resume doesn't say (e.g. Google Tag Manager, a specific warehouse), **ask him** rather than claim it.
3. **Scaffold.** `node scripts/jobs.js new "<Company>" "<Role>" <url>` creates `jobs/<slug>.json` and the private `applications/<slug>.md`, and prints the recruiter link.
4. **Fill `jobs/<slug>.json`** (model it on an existing file in `jobs/`):
   - `headline`: one line, specific to what this team does.
   - `pitch`: 3–5 sentences: who Chris is in this role's language, then the strongest proof.
   - `requirements`: one row per JD requirement, in the JD's own words, most important first. `strength` is `direct` (did it in a job), `adjacent` (built it on the site/in a project, or the same pattern elsewhere), or `building` (honest gap and how he'd close it). Link `proof` to a real page on the site when one exists.
   - `featured`: the 2–3 projects most relevant to this role.
   - `experience`: per employer, pick the 3–5 facts from `career-master.md` that matter most for this JD and write them as resume bullets (action verb, what, how, result/number). Rephrase freely; add nothing that isn't in the master file.
   - `plan`: a concrete 30/60/90 tied to the JD's responsibilities.
   - `skills`: ordered by relevance to the JD.
   - `resume`: `title` (the line under his name, in the role's language), `summary` (3 sentences), `skillGroups` (2–3 groups, JD keywords first, only tools already in `content/resume.json` or proven on the site), `projects` (ids from `content/resume.json`, most relevant first, usually 2). The resume's experience bullets come from `experience` above, so keep each `org` matching `content/resume.json`.
   No fit scores or odds in this file; it's publicly fetchable.
5a. **Build the resume.** `npm run resume -- <slug>` writes the .docx and .pdf. Render the PDF and look at it (e.g. `python -I -c "import pymupdf..."` to PNG). Target one page, two at most. Tell Chris the path of the .docx so he can upload it to the application.
5. **Write the private assessment** in `applications/<slug>.md`: a requirement-by-requirement fit table, gaps, honest callback-odds estimate with reasoning, and the highest-leverage actions (resume edits, referral targets, projects that would close a gap).
6. **Close gaps with real work when it's worth it.** If a core requirement is missing and a small, honest build on the site would demonstrate it (as the Attribution Lab did for growth/marketing data roles), propose it, build it, and add a case study in `index.html` plus a section in `content/career-master.md` (the chat picks it up automatically) and an entry in `content/resume.json` projects.
7. **Validate and preview.** `npm run job -- check` must pass. Preview locally at `for.html?job=<slug>` or `vercel dev` → `/for/<slug>`. Check phone width.
8. **Ship.** Commit on a branch / ask before pushing to `main` (pushing deploys to Vercel). Give Chris the recruiter link from `npm run job -- list`.
