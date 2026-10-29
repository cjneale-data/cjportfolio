// Vercel serverless function (Node runtime). Keeps the OpenRouter key server-side.
// Retrieval: chunks the master career file by section, ranks chunks against the question
// with TF-IDF cosine similarity, and only sends the top-matching chunks to the
// model — real (if small-scale) retrieval instead of pasting the whole doc every time.

const fs = require('fs')
const path = require('path')

// Single source of truth: content/career-master.md (also the basis for every
// tailored resume). HTML comments hold editing notes and open questions for
// Chris, so they're stripped before anything reaches the model.
const CAREER_CONTEXT_PATH = path.join(__dirname, '..', 'content', 'career-master.md')
const RESUME_CONTEXT = fs.readFileSync(CAREER_CONTEXT_PATH, 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .trim()

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
  // A "## Experience: X" heading followed directly by its ### subsections has
  // no body of its own — keep it out of the index so it can't take a top-K slot.
  return chunks
    .filter(c => c.text.trim().split('\n').length > 1)
    .map((c, i) => ({ id: i, title: c.title, text: c.text.trim() }))
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
