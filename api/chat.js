// Vercel serverless function (Node runtime). Keeps the OpenRouter key server-side.

const RESUME_CONTEXT = `
# Christopher Neale — Background & Resume Context

## Personal
- Name: Christopher Neale
- Location: Raleigh, North Carolina (since 2014); grew up in Landenberg, Pennsylvania (Chester County)
- Family: Married, one young daughter (Louisa)
- Contact: cjneale.analyst@gmail.com · 267-421-3426
- LinkedIn: https://www.linkedin.com/in/christophernealeanalyst/
- Hobbies: Golf (former high-school #1 player; builds custom data-tracking dashboards to analyze his game), American Civil War history

## Education
- M.S. in Data Science, Eastern University (Dec 2025) — advanced model development, AI infrastructure, cloud computing
- B.A. in Psychology, North Carolina State University (May 2018) — research methods and statistical analysis; initially pursued Professional Golf Management before switching majors

## Experience (most recent first)

### Senior Manager, Marketing Insights and CRM Analytics — flyExclusive, Raleigh, NC (Nov 2025 – Present)
- Leadership role at the intersection of commercial marketing, data science, and data enablement
- Built an AI price comparison tool modeling competitor private jet pricing against retail pricing, enabling sales to generate accurate personalized flight proposals
- Led the transition off Webflow to a fully custom HTML site using Claude Code, improving performance, feel, and sales generation
- Built API connections between SQL servers and disparate data services into a centralized data repository, replacing legacy systems and allowing the company to terminate its Tableau contract
- Engineered an internal two-way contextual AI chat tool on top of the new BI repository, giving senior leadership instant answers about business outcomes and freeing up analyst time

### Sr. Data Analyst, CRM — TRANZACT, Raleigh, NC (Feb 2025 – Oct 2025)
- Performance marketing and CRM analytics: dashboard development, report generation, advanced data modeling
- Tech environment: Power BI, data lakes, CDP platforms, SMS/email marketing, CRM management
- Developed an agentic RAG system to vet marketing materials, significantly improving CMS (Centers for Medicare & Medicaid Services) approval rates
- Built a weighted project-prioritization scoring model combining quantitative and qualitative inputs to guide project managers

### Email and SMS Analyst — TRANZACT, Raleigh, NC (May 2022 – Feb 2025)
- Earlier role at TRANZACT prior to the Sr. Data Analyst promotion, same general CRM/performance-marketing focus

### Email Marketing and Production Associate — American Kennel Club (Apr 2021 – May 2022)
- Email coding (HTML/CSS), marketing automation, CRM strategy
- First enterprise exposure to data analytics and Tableau — sparked the permanent pivot from general marketing into data analytics

### Earlier: Startup marketing generalist
- Broad marketing execution: email campaigns, Google/Facebook advertising, print/retail marketing, CMS management
- Self-taught HTML/CSS to move from fundraising roles into marketing and front-end development

### Earlier: Cru (international missions organization), South Asia — International Staff Member
- Taught English, led collegiate programs, managed fundraising networks
- Built and maintained a donor database, managed recurring donor communications

## Skills & Tools
Tableau, Power BI, GA4, Python, SQL, Databricks, Scikit-learn, AWS, CRM & CDP platforms, predictive modeling, customer segmentation, RAG/agentic AI systems
`.trim()

const SYSTEM_PROMPT = `You are the AI assistant embedded on Christopher Neale's personal portfolio site. You answer visitor questions about Chris's professional background, skills, and experience, using ONLY the context below as your source of truth.

Rules:
- Be concise, friendly, and professional — a few sentences per answer, not an essay.
- Only state facts that are in the context below. Do not invent employers, dates, or accomplishments.
- If asked something the context doesn't cover (or something unrelated to Chris's professional background), say you don't have that information and suggest emailing cjneale.analyst@gmail.com directly.
- Speak about Chris in the third person (e.g. "Chris led...", not "I led...").

CONTEXT:
${RESUME_CONTEXT}`

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1000

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Chat is not configured yet.' })
    return
  }

  const body = req.body || {}
  const incoming = Array.isArray(body.messages) ? body.messages : []

  const cleaned = incoming
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    res.status(400).json({ error: 'No user message provided.' })
    return
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  const siteUrl = process.env.SITE_URL || 'https://christopherneale.dev'

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': 'Christopher Neale Portfolio Chat'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...cleaned],
        temperature: 0.4,
        max_tokens: 400
      })
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      console.error('OpenRouter error', upstream.status, errText)
      res.status(502).json({ error: 'The chat service is temporarily unavailable.' })
      return
    }

    const data = await upstream.json()
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content

    if (!reply) {
      res.status(502).json({ error: 'The chat service returned an empty response.' })
      return
    }

    res.status(200).json({ reply: reply.trim() })
  } catch (err) {
    console.error('Chat handler error', err)
    res.status(500).json({ error: 'Something went wrong handling your message.' })
  }
}
