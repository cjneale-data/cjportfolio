#!/usr/bin/env node
// Per-application landing pages: jobs/<slug>.json → served at /for/<slug>
// by for.html (see vercel.json), with a tailored resume built from the same
// file by scripts/build-resume.js. Private notes (fit assessment, callback
// odds) live in applications/<slug>.md, which is gitignored and never deployed.
//
//   node scripts/jobs.js new "<Company>" "<Role>" <job-url>   scaffold a page
//   node scripts/jobs.js check                                  validate every page
//   node scripts/jobs.js list                                   print recruiter links

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')
const JOBS_DIR = path.join(ROOT, 'jobs')
const NOTES_DIR = path.join(ROOT, 'applications')
const SITE_URL = 'https://cjneale.xyz'
const STRENGTHS = ['direct', 'adjacent', 'building']
const BASE_RESUME = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'resume.json'), 'utf8'))

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

function recruiterLink(slug) {
  return `${SITE_URL}/for/${slug}?utm_source=recruiter&utm_medium=referral&utm_campaign=${slug}`
}

function readJob(file) {
  return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, file), 'utf8'))
}

function cmdNew(company, role, url) {
  if (!company || !role || !url) {
    console.error('usage: node scripts/jobs.js new "<Company>" "<Role>" <job-url>')
    process.exit(1)
  }
  // Short random suffix so one recruiter can't guess another company's page.
  const slug = `${slugify(company)}-${slugify(role)}-${crypto.randomBytes(2).toString('hex')}`
  fs.mkdirSync(JOBS_DIR, { recursive: true })
  fs.mkdirSync(NOTES_DIR, { recursive: true })

  const job = {
    slug,
    company,
    role,
    jobUrl: url,
    created: new Date().toISOString().slice(0, 10),
    headline: 'TODO',
    pitch: 'TODO',
    requirements: [{ need: 'TODO', evidence: 'TODO', strength: 'direct', proof: null }],
    featured: [{ title: 'TODO', blurb: 'TODO', href: '/#/projects' }],
    experience: [{ org: 'TODO', role: 'TODO', dates: 'TODO', bullets: ['TODO'] }],
    plan: [{ phase: 'TODO', items: ['TODO'] }],
    resume: {
      title: 'TODO',
      summary: 'TODO',
      skillGroups: [{ label: 'TODO', items: 'TODO' }],
      projectsTitle: 'Featured Projects',
      projects: ['TODO'],
    },
    skills: ['TODO'],
  }
  fs.writeFileSync(path.join(JOBS_DIR, slug + '.json'), JSON.stringify(job, null, 2) + '\n')
  fs.writeFileSync(path.join(NOTES_DIR, slug + '.md'), `# ${company} — ${role}\n\nJob: ${url}\nPage: ${recruiterLink(slug)}\n\n## Fit assessment\n\nTODO\n`)
  console.log(`created jobs/${slug}.json and applications/${slug}.md`)
  console.log(recruiterLink(slug))
}

function validate(job, file) {
  const errors = []
  const need = (cond, msg) => { if (!cond) errors.push(msg) }
  need(job.slug + '.json' === file, `slug "${job.slug}" doesn't match filename`)
  for (const k of ['company', 'role', 'jobUrl', 'headline', 'pitch']) need(typeof job[k] === 'string' && job[k], `missing ${k}`)
  need(Array.isArray(job.requirements) && job.requirements.length, 'requirements must be a non-empty array')
  ;(job.requirements || []).forEach((r, i) => {
    need(r.need && r.evidence, `requirements[${i}] needs need + evidence`)
    need(STRENGTHS.includes(r.strength), `requirements[${i}].strength must be one of ${STRENGTHS.join('/')}`)
    if (r.proof) need(r.proof.label && r.proof.href, `requirements[${i}].proof needs label + href`)
  })
  for (const k of ['featured', 'experience', 'plan', 'skills']) need(Array.isArray(job[k]) && job[k].length, `${k} must be a non-empty array`)

  const r = job.resume
  need(r && r.title && r.summary && Array.isArray(r.skillGroups) && Array.isArray(r.projects), 'resume needs title, summary, skillGroups, projects')
  if (r && Array.isArray(r.projects)) {
    const known = Object.keys(BASE_RESUME.projects)
    r.projects.forEach(p => need(known.includes(p), `resume.projects: "${p}" isn't in content/resume.json (${known.join(', ')})`))
  }
  const baseOrgs = BASE_RESUME.experience.map(x => x.org)
  ;(job.experience || []).forEach(x => need(baseOrgs.includes(x.org), `experience org "${x.org}" isn't in content/resume.json`))
  // The page links the PDF, so it must exist. Staleness is only a warning:
  // mtimes don't survive a fresh git clone.
  const pdf = path.join(ROOT, 'resumes', job.slug + '.pdf')
  need(fs.existsSync(pdf), `resumes/${job.slug}.pdf missing — run: npm run resume -- ${job.slug}`)
  if (fs.existsSync(pdf) && fs.statSync(pdf).mtimeMs < fs.statSync(path.join(JOBS_DIR, file)).mtimeMs) {
    console.log(`! ${file}: resume is older than the JSON — run: npm run resume -- ${job.slug}`)
  }
  need(!JSON.stringify(job).includes('TODO'), 'still contains TODO placeholders')
  // Fit scores and odds belong in applications/, not on a page the recruiter can fetch.
  need(!/callback|probabilit|odds|fit score/i.test(JSON.stringify(job)), 'contains private assessment language')
  return errors
}

function cmdCheck() {
  const files = fs.existsSync(JOBS_DIR) ? fs.readdirSync(JOBS_DIR).filter(f => f.endsWith('.json')) : []
  let failed = 0
  for (const file of files) {
    let errors
    try { errors = validate(readJob(file), file) } catch (e) { errors = ['invalid JSON: ' + e.message] }
    if (errors.length) {
      failed++
      console.log(`✗ ${file}\n  - ${errors.join('\n  - ')}`)
    } else {
      console.log(`✓ ${file}`)
    }
  }
  if (!files.length) console.log('no job pages yet')
  process.exit(failed ? 1 : 0)
}

function cmdList() {
  const files = fs.existsSync(JOBS_DIR) ? fs.readdirSync(JOBS_DIR).filter(f => f.endsWith('.json')) : []
  for (const file of files) {
    const job = readJob(file)
    console.log(`${job.company} — ${job.role}\n  ${recruiterLink(job.slug)}`)
  }
}

const [cmd, ...args] = process.argv.slice(2)
if (cmd === 'new') cmdNew(...args)
else if (cmd === 'check') cmdCheck()
else if (cmd === 'list') cmdList()
else {
  console.error('usage: node scripts/jobs.js <new|check|list>')
  process.exit(1)
}
