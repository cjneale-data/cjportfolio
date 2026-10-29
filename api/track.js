// Vercel serverless function (Node runtime). Ingestion endpoint for track.js.
// Validates every event against the shared taxonomy in lib/events.js, drops
// bots, and inserts with ON CONFLICT DO NOTHING on the client-generated
// event_id — retried beacons dedupe instead of double-counting.
// No IP addresses or user agents are stored. See DEPLOYMENT.md.

const { EVENT_TAXONOMY, getPool, ensureSchema } = require('../lib/events')

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|vercel-screenshot/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BODY = 8 * 1024

function str(v, max) {
  return typeof v === 'string' && v.length ? v.slice(0, max) : null
}

// Keep only the props the taxonomy declares for this event, as short scalars.
function cleanProps(eventName, props) {
  const out = {}
  if (!props || typeof props !== 'object') return out
  for (const key of EVENT_TAXONOMY[eventName].props) {
    const v = props[key]
    if (typeof v === 'boolean' || typeof v === 'number') out[key] = v
    else if (typeof v === 'string') out[key] = v.slice(0, 200)
  }
  return out
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.DATABASE_URL) {
    res.status(204).end()
    return
  }

  if (BOT_UA.test(req.headers['user-agent'] || '')) {
    res.status(204).end()
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    if (body.length > MAX_BODY) {
      res.status(413).json({ error: 'Payload too large' })
      return
    }
    try { body = JSON.parse(body) } catch (e) { body = null }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const eventName = body.event_name
  if (!Object.prototype.hasOwnProperty.call(EVENT_TAXONOMY, eventName)) {
    res.status(422).json({ error: 'Unknown event_name' })
    return
  }
  if (!UUID_RE.test(body.event_id || '') || !str(body.anonymous_id, 64)) {
    res.status(422).json({ error: 'event_id and anonymous_id are required' })
    return
  }

  // Trust the client clock only within a sane window; otherwise use server time.
  let occurredAt = new Date(body.occurred_at)
  if (isNaN(occurredAt) || Math.abs(Date.now() - occurredAt) > 24 * 60 * 60 * 1000) {
    occurredAt = new Date()
  }

  const consentAds = body.consent_ads === true
  const touch = body.touch && typeof body.touch === 'object' ? body.touch : {}
  // A visitor who opted out never has click IDs stored, even if the client sent them.
  const clickIdType = consentAds ? str(touch.click_id_type, 20) : null
  const clickId = consentAds ? str(touch.click_id, 500) : null
  const fbc = consentAds ? str(touch.fbc, 600) : null

  let firstTouch = null
  if (body.first_touch && typeof body.first_touch === 'object') {
    firstTouch = {}
    for (const k of ['at', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer_host']) {
      if (str(body.first_touch[k], 200)) firstTouch[k] = str(body.first_touch[k], 200)
    }
  }

  try {
    await ensureSchema()
    await getPool().query(
      `INSERT INTO site_events (
         event_id, event_name, occurred_at, anonymous_id, session_id, page_path,
         referrer_host, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
         click_id_type, click_id, fbc, first_touch, consent_ads, props
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        body.event_id, eventName, occurredAt, str(body.anonymous_id, 64), str(body.session_id, 64),
        str(body.page_path, 300), str(touch.referrer_host, 200),
        str(touch.utm_source, 200), str(touch.utm_medium, 200), str(touch.utm_campaign, 200),
        str(touch.utm_content, 200), str(touch.utm_term, 200),
        clickIdType, clickId, fbc,
        firstTouch ? JSON.stringify(firstTouch) : null, consentAds,
        JSON.stringify(cleanProps(eventName, body.props)),
      ]
    )
    res.status(204).end()
  } catch (err) {
    console.error('track error:', err)
    res.status(500).json({ error: 'Database error' })
  }
}
