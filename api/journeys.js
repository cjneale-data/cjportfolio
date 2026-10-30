// Vercel serverless function (Node runtime). Read side of the UTM Journey
// Tracker (journeys.html): recent sessions stitched into journeys, each
// landing checked against the UTM taxonomy, plus channel and data-quality
// summaries. Public, so everything returned is sanitized:
//   - session and visitor IDs are short hashes
//   - UTM values outside the taxonomy are replaced with labels (lib/utm-taxonomy.js)
//   - page paths are mapped to page names; unknown paths become "Other page"
//   - utm_term and click ID values are never returned
//   - private sessions (personal links, /for/ pages) are left out entirely
//
//   GET /api/journeys?range=24h|7d|30d&me=<anonymous_id>
// `me` only marks which sessions belong to the caller's own browser.

const crypto = require('crypto')
const { getPool, ensureSchema } = require('../lib/events')
const { TAXONOMY, checkTouch, channelFor, publicTouch } = require('../lib/utm-taxonomy')

const RANGES = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }
const MAX_EVENTS = 5000
const MAX_SESSIONS = 40
const MAX_STEPS = 14

const PAGES = {
  '/': 'Home', '/index.html': 'Home', '/#/': 'Home',
  '/#/resume': 'Resume', '/#/projects': 'Projects',
  '/#/project/podflow': 'PodFlow case study',
  '/#/project/resume-chat': 'Resume Chat case study',
  '/#/project/chefai': 'ChefAI case study',
  '/#/project/attribution': 'Attribution case study',
  '/#/project/utm-journeys': 'UTM Tracker case study',
  '/#/project/tensorfit': 'TensorFit case study',
  '/#/project/mushroom-classifier': 'Mushroom case study',
  '/player.html': 'PodFlow player',
  '/journeys.html': 'Live journeys dashboard',
}

const EVENTS_SQL = `
  WITH public_sessions AS (
    SELECT session_id
    FROM site_events
    WHERE occurred_at >= now() - make_interval(hours => $1::int) AND session_id IS NOT NULL
    GROUP BY session_id
    HAVING bool_and(utm_source IS DISTINCT FROM 'recruiter' AND coalesce(page_path, '') NOT LIKE '/for%')
  )
  SELECT e.session_id, e.anonymous_id, e.event_name, e.occurred_at, e.page_path,
         e.referrer_host, e.utm_source, e.utm_medium, e.utm_campaign, e.utm_content,
         e.click_id_type, e.first_touch, e.props
  FROM site_events e
  JOIN public_sessions USING (session_id)
  WHERE e.occurred_at >= now() - make_interval(hours => $1::int)
  ORDER BY e.occurred_at DESC
  LIMIT ${MAX_EVENTS}
`

const shortHash = (v, n) => crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, n)

function pageName(path) {
  if (!path) return 'Other page'
  const clean = path.split('?')[0]
  return PAGES[clean] || 'Other page'
}

function step(e) {
  const t = e.occurred_at
  const props = e.props || {}
  if (e.event_name === 'page_view') return { t, kind: 'page', label: pageName(e.page_path) }
  if (e.event_name === 'contact_click') {
    const method = ['email', 'phone', 'linkedin'].includes(props.method) ? props.method : 'contact'
    return { t, kind: 'conversion', label: `Contact (${method})` }
  }
  if (e.event_name === 'chat_message_sent') return { t, kind: 'engage', label: 'Asked the resume chat' }
  if (e.event_name === 'outbound_click') return { t, kind: 'outbound', label: 'Opened a live demo' }
  return null
}

function buildSessions(rows, me) {
  const bySession = new Map()
  for (const e of rows.slice().reverse()) {
    if (!bySession.has(e.session_id)) bySession.set(e.session_id, [])
    bySession.get(e.session_id).push(e)
  }

  const sessions = []
  for (const [sid, events] of bySession) {
    // The landing carries the touch; fall back to the first event if the
    // landing row fell outside the time window.
    const landing = events.find(e => e.event_name === 'page_view' && e.props && e.props.is_landing) || events[0]
    const steps = []
    for (const e of events) {
      const s = step(e)
      if (!s) continue
      const prev = steps[steps.length - 1]
      if (prev && prev.kind === 'page' && s.kind === 'page' && prev.label === s.label) continue
      steps.push(s)
    }
    const started = new Date(events[0].occurred_at)
    const firstAt = landing.first_touch && landing.first_touch.at ? new Date(landing.first_touch.at) : null
    sessions.push({
      id: shortHash(sid, 8),
      visitor: 'V-' + shortHash(landing.anonymous_id, 4).toUpperCase(),
      is_you: !!me && landing.anonymous_id === me,
      returning: !!firstAt && !isNaN(firstAt) && started - firstAt > 60 * 1000,
      started_at: events[0].occurred_at,
      last_at: events[events.length - 1].occurred_at,
      channel: channelFor(landing),
      touch: publicTouch(landing),
      quality: checkTouch(landing),
      converted: steps.some(s => s.kind === 'conversion'),
      pages: steps.filter(s => s.kind === 'page').length,
      steps: steps.slice(0, MAX_STEPS),
      more_steps: Math.max(0, steps.length - MAX_STEPS),
    })
  }
  return sessions.sort((a, b) => new Date(b.last_at) - new Date(a.last_at))
}

function summarize(sessions) {
  const n = sessions.length
  const tagged = sessions.filter(s => s.quality.status !== 'untagged')
  const valid = tagged.filter(s => s.quality.status === 'valid')
  const converted = sessions.filter(s => s.converted)

  const group = (keyOf) => {
    const m = new Map()
    for (const s of sessions) {
      const k = keyOf(s)
      if (!k) continue
      const r = m.get(k) || { key: k, sessions: 0, conversions: 0 }
      r.sessions++
      if (s.converted) r.conversions++
      m.set(k, r)
    }
    return [...m.values()].sort((a, b) => b.sessions - a.sessions)
  }

  const issues = {}
  for (const s of tagged) for (const code of s.quality.issues) issues[code] = (issues[code] || 0) + 1

  return {
    sessions: n,
    visitors: new Set(sessions.map(s => s.visitor)).size,
    tagged_sessions: tagged.length,
    valid_sessions: valid.length,
    converted_sessions: converted.length,
    pages_per_session: n ? +(sessions.reduce((a, s) => a + s.pages, 0) / n).toFixed(1) : 0,
    by_channel: group(s => s.channel),
    by_source_medium: group(s => s.touch.source ? `${s.touch.source} / ${s.touch.medium || '(none)'}` : null),
    by_campaign: group(s => s.touch.campaign),
    issues,
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: 'Live data is not configured.', taxonomy: TAXONOMY })
    return
  }

  const range = RANGES[req.query.range] ? req.query.range : '7d'
  const me = typeof req.query.me === 'string' ? req.query.me.slice(0, 64) : null

  try {
    await ensureSchema()
    const { rows } = await getPool().query(EVENTS_SQL, [RANGES[range]])
    const sessions = buildSessions(rows, me)
    res.status(200).json({
      generated_at: new Date().toISOString(),
      range,
      truncated: rows.length === MAX_EVENTS,
      summary: summarize(sessions),
      sessions: sessions.slice(0, MAX_SESSIONS),
      taxonomy: TAXONOMY,
    })
  } catch (err) {
    console.error('journeys error:', err)
    res.status(500).json({ error: 'Database error' })
  }
}

module.exports.buildSessions = buildSessions
module.exports.summarize = summarize
