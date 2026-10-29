#!/usr/bin/env node
// Builds a tailored resume for one application: base facts from
// content/resume.json, tailoring (title, summary, skill groups, experience
// bullets, project picks) from the "resume" block + "experience" in
// jobs/<slug>.json. Writes resumes/<slug>.docx, then resumes/<slug>.pdf via
// LibreOffice if it's installed. for.html links the PDF.
//
//   node scripts/build-resume.js <slug>     one application
//   node scripts/build-resume.js --all      every jobs/*.json

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, AlignmentType,
  BorderStyle, LevelFormat, TabStopType,
} = require('docx')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'resumes')
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'resume.json'), 'utf8'))

// Mirrors the hand-built resume: Calibri, navy headings with a rule under them.
const FONT = 'Calibri'
const NAVY = '2C3E50'
const pt = n => n * 2 // docx sizes are half-points
const BODY = pt(9.5)

const SOFFICE_CANDIDATES = [
  process.env.SOFFICE,
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/bin/soffice',
].filter(Boolean)

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: BODY, ...opts })
}

function link(label, href, size = pt(9)) {
  return new ExternalHyperlink({ link: href, children: [run(label, { size, color: '1F5FAD', underline: {} })] })
}

function heading(text) {
  return new Paragraph({
    spacing: { before: 140, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 1 } },
    children: [run(text.toUpperCase(), { bold: true, size: pt(10.5), color: NAVY })],
  })
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 30 },
    children: [run(text)],
  })
}

function build(job) {
  const r = job.resume
  const tailored = Object.fromEntries((job.experience || []).map(x => [x.org, x.bullets]))
  const children = []

  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(base.name.toUpperCase(), { bold: true, size: pt(17), color: NAVY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [run(r.title || base.defaultTitle, { bold: true, size: pt(11), color: NAVY })] }),
  )
  const contact = []
  base.contact.forEach(c => contact.push(run(c + '  |  ', { size: pt(9) })))
  base.links.forEach((l, i) => {
    contact.push(link(l.label, l.href))
    if (i < base.links.length - 1) contact.push(run('  |  ', { size: pt(9) }))
  })
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: contact }))

  children.push(heading('Summary'), new Paragraph({ spacing: { after: 20 }, children: [run(r.summary)] }))

  children.push(heading('Technical Expertise'))
  for (const g of r.skillGroups || base.skillGroups) {
    children.push(new Paragraph({ spacing: { after: 30 }, children: [run(g.label + ': ', { bold: true }), run(g.items)] }))
  }

  children.push(heading('Professional Experience'))
  for (const x of base.experience) {
    children.push(new Paragraph({
      spacing: { before: 80, after: 30 },
      tabStops: [{ type: TabStopType.RIGHT, position: 10800 }],
      children: [
        run(`${x.org}, ${x.location}`, { bold: true, size: pt(10) }),
        run(`   ${x.role}`, { italics: true, color: NAVY, size: pt(10) }),
        run(`\t${x.dates}`, { italics: true, color: NAVY, size: pt(10) }),
      ],
    }))
    ;(tailored[x.org] || x.bullets).forEach(b => children.push(bullet(b)))
  }
  children.push(
    new Paragraph({ spacing: { before: 80, after: 30 }, children: [run('Additional Experience', { bold: true, size: pt(10) })] }),
    bullet(base.additionalExperience),
  )

  children.push(heading(r.projectsTitle || 'Featured Projects'))
  for (const id of r.projects) {
    const p = base.projects[id]
    if (!p) throw new Error(`unknown project "${id}" in jobs/${job.slug}.json`)
    children.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [run(p.name, { bold: true })] }))
    p.bullets.forEach(b => children.push(bullet(b)))
    if (p.link) children.push(new Paragraph({ indent: { left: 360 }, spacing: { after: 30 }, children: [link(p.link, p.link, BODY)] }))
  }

  children.push(heading('Education'))
  for (const e of base.education) {
    children.push(new Paragraph({ spacing: { after: 10 }, children: [run(e.school, { bold: true }), run(`  –  ${e.degree}`)] }))
    if (e.detail) children.push(new Paragraph({ indent: { left: 360 }, spacing: { after: 20 }, children: [run(e.detail)] }))
  }

  return new Document({
    creator: base.name,
    title: `${base.name} — Resume — ${job.company}`,
    styles: { default: { document: { run: { font: FONT, size: BODY } } } },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 220 } } } }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 576, bottom: 576, left: 720, right: 720 } } },
      children,
    }],
  })
}

function toPdf(docxPath) {
  const soffice = SOFFICE_CANDIDATES.find(p => fs.existsSync(p))
  if (!soffice) return null
  execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', OUT_DIR, docxPath], { stdio: 'ignore' })
  const pdfPath = docxPath.replace(/\.docx$/, '.pdf')
  if (!fs.existsSync(pdfPath)) return null
  const pages = (fs.readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
  return { pdfPath, pages }
}

async function buildOne(slug) {
  const job = JSON.parse(fs.readFileSync(path.join(ROOT, 'jobs', slug + '.json'), 'utf8'))
  if (!job.resume) throw new Error(`jobs/${slug}.json has no "resume" block`)
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const docxPath = path.join(OUT_DIR, slug + '.docx')
  fs.writeFileSync(docxPath, await Packer.toBuffer(build(job)))
  const pdf = toPdf(docxPath)
  console.log(`✓ resumes/${slug}.docx` + (pdf ? ` + .pdf (${pdf.pages} page${pdf.pages === 1 ? '' : 's'})` : ' (no LibreOffice found; PDF skipped)'))
  if (pdf && pdf.pages > 2) console.log('  ! over two pages, trim bullets or projects')
}

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('usage: node scripts/build-resume.js <slug> | --all')
    process.exit(1)
  }
  const slugs = arg === '--all'
    ? fs.readdirSync(path.join(ROOT, 'jobs')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5))
    : [arg]
  for (const slug of slugs) await buildOne(slug)
}

main().catch(err => { console.error(err.message); process.exit(1) })
