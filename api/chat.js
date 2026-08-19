// Vercel serverless function (Node runtime). Keeps the OpenRouter key server-side.
// Retrieval: chunks RESUME_CONTEXT by section, ranks chunks against the question
// with TF-IDF cosine similarity, and only sends the top-matching chunks to the
// model — real (if small-scale) retrieval instead of pasting the whole doc every time.

const RESUME_CONTEXT = `
# Christopher Neale — Background & Resume Context

## Personal
- Name: Christopher Neale (Data Science & Applied AI Leader)
- Currently: Senior Manager, Marketing Insights & CRM Analytics at flyExclusive — see Experience section for the full role
- Location: Raleigh, North Carolina (since 2014); grew up in Landenberg, Pennsylvania (Chester County)
- Family: Married, one young daughter (Louisa)
- Contact: cjneale.analyst@gmail.com · 984-382-3980
- LinkedIn: https://www.linkedin.com/in/christophernealeanalyst/
- Portfolio: https://cjportfolio-inky.vercel.app
- Hobbies: Golf (former high-school #1 player; builds custom data-tracking dashboards to analyze his game), American Civil War history

## Summary
Data science practitioner with 5 years building production data and AI systems, most recently as Senior Manager at flyExclusive. M.S. in Data Science. Builds agentic and LLM-powered systems end to end, from LangGraph state machines to production pipelines, and moves fast from prototype to decisions executives can act on. Self-described "vibe coder" who works with AI coding tools like Claude Code as a core part of his workflow (usually with several terminals open at once).

## Education
- M.S. in Data Science, Eastern University (Dec 2025) — classes in Machine Learning, Cloud Computing, and Data Analysis
- B.A. in Psychology, North Carolina State University (May 2018) — research methods and statistical analysis; initially pursued Professional Golf Management before switching majors

## Technical Expertise
- Applied AI / ML: PyTorch, scikit-learn, XGBoost, local LLM deployment, speech recognition, prompt design, offline model evaluation (precision/recall/F1)
- Data & Systems: Python, SQL, Databricks, REST APIs (Flask), CRM/CDP architecture, Master Data Management, data pipelines
- Analytics & Delivery: Tableau, Power BI, GA4, multi-touch attribution, A/B testing, AI-assisted development (Claude Code), executive stakeholder communication

## Experience (most recent first)

### Senior Manager, Marketing Insights & CRM Analytics — flyExclusive, Raleigh, NC (Nov 2025 – Present)
- Built an autonomous data enrichment pipeline connecting LLM APIs to the CRM database, generating personalized outreach content and powering a lead-scoring model that prioritizes high-value accounts
- Led a CRM systems transformation (HubSpot governance, scalable data architecture, deduplication workflows, Master Data Management), then redesigned performance dashboards and attribution frameworks connecting marketing activity to acquisition, retention, and high-value segments
- Shipped a Python pricing tool for the retail sales team that analyzed competitor pricing and directly shaped 2026 pricing strategy
- Migrated and redesigned the company website off its legacy CMS platform onto a custom-built site with rich data pipelines for active quoting
- Developed AI proposal and agreement tools enabling the sales team to build company-approved assets quickly at scale

### Sr. Data Analyst, CRM — TRANZACT, Raleigh, NC (May 2022 – Nov 2025)
- Partnered with commercial and finance leadership on sales performance, attribution, and forecasting analytics; built CRM/ESP integrations (SQL, JSON REST APIs) syncing behavioral data into Iterable for 10+ lifecycle campaigns
- Ran multi-touch attribution modeling and a structured A/B testing program (50% win rate), improving CTR by 30%

### Additional experience
- American Kennel Club, Email Marketing Associate (2021–2022)
- OnPoint, Marketing Manager (2020–2021) — lifecycle marketing, Tableau-driven audience insights, GTM execution with C-suite alignment

## Featured Applied AI Projects

### PodFlow — M.S. Data Science Capstone, Eastern University, 2025
- Full audio-to-insight pipeline built solo: transcription (faster-Whisper), automatic content segmentation via a trained CNN-BiLSTM model (benchmarked against XGBoost, focal loss for class imbalance), and LLM-based metadata enrichment, served through a REST API to a working web app
- Built an offline evaluation framework scoring precision/recall/F1 against hand-labeled ground truth, and deployed a local quantized LLM (Qwen2.5 via llama.cpp) with a rules-based fallback for resilience
- Demo: linked from this site's nav ("Pod Flow App")

### ChefAI — Agentic Meal-Planning Assistant (LangGraph)
- Conversational meal-planning agent on a LangGraph state machine, with a conditional router that inspects state each turn and dispatches to whichever slot (allergies, diet, dislikes, craving, prep time, budget) still needs filling; LLM-based extraction pulls structured fields from free text
- Deliberate agent-autonomy-versus-structure tradeoff: accepted added latency/cost from LLM-based slot extraction for a materially better conversational experience than a rigid form, keeping the graph simple with single-node-per-turn routing and externally persisted state
- Live demo: https://chefai-noemgucqmarbfwe2euwdsl.streamlit.app/

### Resume Chat — this site's "Ask about Chris" widget
- The chat feature embedded on this portfolio site (the one answering this question): chunks this resume context by section, ranks chunks against the visitor's question with TF-IDF cosine similarity, and only sends the top-matching chunks to the model as grounding — real retrieval, not the whole document stuffed into every prompt
- Backed by an automated eval harness that checks factual-grounding questions and out-of-scope refusal behavior

## Skills & Tools
Tableau, Power BI, GA4, Python, SQL, Databricks, Scikit-learn, PyTorch, XGBoost, AWS, CRM & CDP platforms, predictive modeling, customer segmentation, RAG/agentic AI systems, LangGraph, prompt engineering, vector retrieval
`.trim()

// --- Chunking: split on ## / ### markdown headers into retrievable sections ---
function chunkContext(text) {
  const lines = text.split('\n')
  const chunks = []
  let current = null
  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.*)/)
    if (heading) {
      if (current) chunks.push(current)
      current = { title: heading[2].trim(), text: line + '\n' }
    } else if (current) {
      current.text += line + '\n'
    }
  }
  if (current) chunks.push(current)
  return chunks.map((c, i) => ({ id: i, title: c.title, text: c.text.trim() }))
}

const CHUNKS = chunkContext(RESUME_CONTEXT)
const IDENTITY_CHUNK_ID = CHUNKS.findIndex(c => c.title === 'Personal')

// --- Minimal TF-IDF + cosine similarity retrieval (no external deps) ---
const STOPWORDS = new Set('a an the of to in on for with at by from and or is are was were be been being he she it his her their this that as does did do'.split(' '))

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(t => t.length > 1 && !STOPWORDS.has(t))
}

// Sparse retrieval's classic weakness: a question can share zero vocabulary
// with the passage that answers it (e.g. "school" vs. "M.S. in Data Science").
// A small synonym-expansion table is the standard, cheap mitigation — expand
// only the query side, onto terms that already exist in the corpus.
const QUERY_SYNONYMS = {
  study: ['education', 'degree'], studied: ['education', 'degree'],
  school: ['education', 'university', 'degree'], college: ['education', 'university'],
  degree: ['education'], major: ['education'],
  job: ['experience', 'employer'], work: ['experience', 'employer'], works: ['experience', 'employer'],
  employer: ['experience'], company: ['experience'], role: ['experience'],
  title: ['experience'], currently: ['experience'], current: ['experience'],
  skills: ['skills'], tools: ['skills'], technologies: ['skills'],
  contact: ['personal', 'email'], reach: ['personal', 'email'], email: ['personal'],
  hobbies: ['personal'], interests: ['personal'], live: ['personal'], location: ['personal'],
}

function expandQueryTokens(tokens) {
  const expanded = new Set(tokens)
  for (const t of tokens) for (const syn of QUERY_SYNONYMS[t] || []) expanded.add(syn)
  return [...expanded]
}

function termFreq(tokens) {
  const tf = {}
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1
  return tf
}

function buildIndex(chunks) {
  const docsTokens = chunks.map(c => tokenize(c.text))
  const df = {}
  for (const tokens of docsTokens) {
    for (const term of new Set(tokens)) df[term] = (df[term] || 0) + 1
  }
  const n = chunks.length
  const idf = {}
  for (const term in df) idf[term] = Math.log((n + 1) / (df[term] + 1)) + 1

  const vectors = docsTokens.map(tokens => {
    const tf = termFreq(tokens)
    const vec = {}
    let norm = 0
    for (const term in tf) {
      const w = tf[term] * (idf[term] || 0)
      vec[term] = w
      norm += w * w
    }
    norm = Math.sqrt(norm) || 1
    for (const term in vec) vec[term] /= norm
    return vec
  })

  return { idf, vectors }
}

const INDEX = buildIndex(CHUNKS)

function vectorize(tokens, idf) {
  const tf = termFreq(tokens)
  const vec = {}
  let norm = 0
  for (const term in tf) {
    const w = tf[term] * (idf[term] || 0)
    if (w === 0) continue
    vec[term] = w
    norm += w * w
  }
  norm = Math.sqrt(norm) || 1
  for (const term in vec) vec[term] /= norm
  return vec
}

function cosineSim(a, b) {
  let dot = 0
  for (const term in a) if (b[term]) dot += a[term] * b[term]
  return dot
}

function retrieveChunks(query, topK) {
  const queryVec = vectorize(expandQueryTokens(tokenize(query)), INDEX.idf)
  const scored = CHUNKS.map((c, i) => ({ chunk: c, score: cosineSim(queryVec, INDEX.vectors[i]) }))
  scored.sort((a, b) => b.score - a.score)

  const best = scored[0]
  // Fully degenerate query (no vocabulary overlap with the corpus at all, even
  // after synonym expansion) — fall back to the full context rather than risk
  // answering from an uninformed selection.
  if (!best || best.score < 1e-6) return CHUNKS

  // Take the top-K by rank, not just chunks with score > 0 — a query that only
  // weakly matches one chunk shouldn't starve the selection down to just that
  // one chunk when several plausible candidates are tied nearby.
  const selected = scored.slice(0, topK).map(s => s.chunk)
  if (IDENTITY_CHUNK_ID >= 0 && !selected.some(c => c.id === IDENTITY_CHUNK_ID)) {
    selected.push(CHUNKS[IDENTITY_CHUNK_ID])
  }
  return selected
}

function buildSystemPrompt(retrievedChunks) {
  const context = retrievedChunks.map(c => c.text).join('\n\n')
  return `You are the AI assistant embedded on Christopher Neale's personal portfolio site. You answer visitor questions about Chris's professional background, skills, and experience, using ONLY the context below as your source of truth.

Rules:
- Be concise, friendly, and professional — a few sentences per answer, not an essay.
- Only state facts that are in the context below. Do not invent employers, dates, or accomplishments.
- If asked something the context doesn't cover (or something unrelated to Chris's professional background), say you don't have that information and suggest emailing cjneale.analyst@gmail.com directly.
- Speak about Chris in the third person (e.g. "Chris led...", not "I led...").

CONTEXT:
${context}`
}

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1000
const TOP_K_CHUNKS = 4

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

  const latestQuestion = cleaned[cleaned.length - 1].content
  const retrieved = retrieveChunks(latestQuestion, TOP_K_CHUNKS)
  const systemPrompt = buildSystemPrompt(retrieved)

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  const siteUrl = process.env.SITE_URL || 'https://christopherneale.dev'
  const debugRetrieval = process.env.DEBUG_RETRIEVAL === '1'

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
        messages: [{ role: 'system', content: systemPrompt }, ...cleaned],
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

    const payload = { reply: reply.trim() }
    if (debugRetrieval) payload.retrievedChunks = retrieved.map(c => c.title)
    res.status(200).json(payload)
  } catch (err) {
    console.error('Chat handler error', err)
    res.status(500).json({ error: 'Something went wrong handling your message.' })
  }
}
