// Vercel serverless function (Node runtime). Read side of the Attribution Lab:
//   ?view=attribution  first-touch / last-touch / linear credit by channel
//   ?view=campaigns    visits + conversions per utm_campaign (e.g. per-job recruiter links)
//   ?view=quality      data-quality checks (orphan conversions, untagged traffic, consent share)
//   ?view=export       dry-run offline-conversion payloads shaped for Google Ads,
//                      Meta CAPI, TikTok Events API, and LinkedIn CAPI — built, never sent
// All views take ?days=N (default 30, max 365). Requires STATS_TOKEN as a
// Bearer header or ?token= — campaign names reveal where Chris is applying.

const crypto = require('crypto')
const { CONVERSION_EVENTS, CHANNEL_SQL, getPool, ensureSchema } = require('../lib/events')

const LOOKBACK_DAYS = 30        // attribution window for touches before a conversion
const CLICK_ID_WINDOW_DAYS = 90 // how far back a click ID can be credited, matching Google/Meta defaults
const CONVERSION_VALUE = 1      // placeholder; a real product would send revenue or predicted LTV here

function authorized(req) {
  const expected = process.env.STATS_TOKEN
  if (!expected) return false
  const header = req.headers.authorization || ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || '')
  const a = Buffer.from(String(given))
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Landings carry the touch; each conversion is credited across the landings
// that preceded it inside the lookback window.
const ATTRIBUTION_SQL = `
  WITH touches AS (
    SELECT anonymous_id, occurred_at, ${CHANNEL_SQL} AS channel
    FROM site_events
    WHERE event_name = 'page_view' AND (props->>'is_landing')::boolean
  ),
  conversions AS (
    SELECT event_id, anonymous_id, occurred_at
    FROM site_events
    WHERE event_name = ANY($1) AND occurred_at >= now() - make_interval(days => $2::int)
  ),
  paths AS (
    SELECT c.event_id, t.channel,
      ROW_NUMBER() OVER (PARTITION BY c.event_id ORDER BY t.occurred_at)      AS rn_first,
      ROW_NUMBER() OVER (PARTITION BY c.event_id ORDER BY t.occurred_at DESC) AS rn_last,
      COUNT(*)     OVER (PARTITION BY c.event_id)                             AS path_len
    FROM conversions c
    JOIN touches t
      ON t.anonymous_id = c.anonymous_id
     AND t.occurred_at <= c.occurred_at
     AND t.occurred_at >  c.occurred_at - interval '${LOOKBACK_DAYS} days'
  )
  SELECT channel,
    SUM(CASE WHEN rn_first = 1 THEN 1 ELSE 0 END)::int AS first_touch,
    SUM(CASE WHEN rn_last  = 1 THEN 1 ELSE 0 END)::int AS last_touch,
    ROUND(SUM(1.0 / path_len), 2)::float                AS linear
  FROM paths
  GROUP BY channel
  ORDER BY last_touch DESC, channel
`

const CAMPAIGNS_SQL = `
  SELECT utm_campaign,
    MIN(utm_source)                                                   AS utm_source,
    COUNT(*) FILTER (WHERE event_name = 'page_view' AND (props->>'is_landing')::boolean)::int AS sessions,
    COUNT(DISTINCT anonymous_id)::int                                 AS visitors,
    COUNT(*) FILTER (WHERE event_name = 'page_view')::int             AS page_views,
    COUNT(*) FILTER (WHERE event_name = ANY($1))::int                 AS conversions,
    MIN(occurred_at)                                                  AS first_seen,
    MAX(occurred_at)                                                  AS last_seen
  FROM site_events
  WHERE utm_campaign IS NOT NULL AND occurred_at >= now() - make_interval(days => $2::int)
  GROUP BY utm_campaign
  ORDER BY last_seen DESC
`

const QUALITY_SQL = `
  WITH recent AS (
    SELECT * FROM site_events WHERE occurred_at >= now() - make_interval(days => $2::int)
  )
  SELECT
    (SELECT json_object_agg(event_name, n) FROM (
       SELECT event_name, COUNT(*)::int AS n FROM recent GROUP BY event_name) x)  AS events_by_name,
    (SELECT COUNT(*)::int FROM recent c
      WHERE c.event_name = ANY($1)
        AND NOT EXISTS (
          SELECT 1 FROM site_events t
          WHERE t.anonymous_id = c.anonymous_id AND t.event_name = 'page_view'
            AND t.occurred_at <= c.occurred_at
            AND t.occurred_at > c.occurred_at - interval '${LOOKBACK_DAYS} days'))  AS orphan_conversions,
    (SELECT ROUND(AVG(CASE WHEN utm_source IS NULL AND click_id IS NULL AND referrer_host IS NULL
                           THEN 1.0 ELSE 0 END), 3)::float
       FROM recent WHERE event_name = 'page_view' AND (props->>'is_landing')::boolean) AS direct_share_of_landings,
    (SELECT ROUND(AVG(CASE WHEN consent_ads THEN 0 ELSE 1.0 END), 3)::float FROM recent) AS opted_out_share,
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM received_at - occurred_at)), 2)::float FROM recent) AS avg_ingest_lag_s
`

// For each consented conversion, find the most recent click ID this visitor
// arrived with inside the click-ID window.
const EXPORT_SQL = `
  SELECT c.event_id, c.event_name, c.occurred_at, c.page_path, c.props,
         k.click_id_type, k.click_id, k.fbc
  FROM site_events c
  JOIN LATERAL (
    SELECT click_id_type, click_id, fbc
    FROM site_events t
    WHERE t.anonymous_id = c.anonymous_id AND t.click_id IS NOT NULL
      AND t.consent_ads
      AND t.occurred_at <= c.occurred_at
      AND t.occurred_at >  c.occurred_at - interval '${CLICK_ID_WINDOW_DAYS} days'
    ORDER BY t.occurred_at DESC
    LIMIT 1
  ) k ON true
  WHERE c.event_name = ANY($1) AND c.consent_ads
    AND c.occurred_at >= now() - make_interval(days => $2::int)
  ORDER BY c.occurred_at DESC
  LIMIT 500
`

function googleAdsTime(d) {
  // Google Ads wants "yyyy-mm-dd hh:mm:ss+00:00"
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '+00:00')
}

function buildExport(rows, siteUrl) {
  const out = { google_ads: [], meta_capi: [], tiktok_events: [], linkedin_capi: [] }
  for (const r of rows) {
    const t = new Date(r.occurred_at)
    const url = siteUrl + (r.page_path || '/')
    if (['gclid', 'gbraid', 'wbraid'].includes(r.click_id_type)) {
      out.google_ads.push({
        [r.click_id_type]: r.click_id,
        conversion_action: 'customers/{CUSTOMER_ID}/conversionActions/{CONTACT_ACTION_ID}',
        conversion_date_time: googleAdsTime(t),
        conversion_value: CONVERSION_VALUE,
        currency_code: 'USD',
        order_id: r.event_id,
      })
    } else if (r.click_id_type === 'fbclid') {
      out.meta_capi.push({
        event_name: 'Contact',
        event_time: Math.floor(t.getTime() / 1000),
        event_id: r.event_id, // same id the browser would send to the Pixel, so Meta dedupes
        action_source: 'website',
        event_source_url: url,
        user_data: { fbc: r.fbc },
        custom_data: { value: CONVERSION_VALUE, currency: 'USD' },
      })
    } else if (r.click_id_type === 'ttclid') {
      out.tiktok_events.push({
        event: 'Contact',
        event_time: Math.floor(t.getTime() / 1000),
        event_id: r.event_id,
        user: { ttclid: r.click_id },
        page: { url },
        properties: { value: CONVERSION_VALUE, currency: 'USD' },
      })
    } else if (r.click_id_type === 'li_fat_id') {
      out.linkedin_capi.push({
        conversion: 'urn:lla:llaPartnerConversion:{CONVERSION_ID}',
        conversionHappenedAt: t.getTime(),
        eventId: r.event_id,
        user: { userIds: [{ idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID', idValue: r.click_id }] },
        conversionValue: { currencyCode: 'USD', amount: String(CONVERSION_VALUE) },
      })
    }
  }
  return out
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.DATABASE_URL || !process.env.STATS_TOKEN) {
    res.status(503).json({ error: 'Attribution stats are not configured.' })
    return
  }
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const view = req.query.view || 'attribution'
  const days = String(Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365))
  const params = [CONVERSION_EVENTS, days]

  try {
    await ensureSchema()
    const pool = getPool()
    if (view === 'attribution') {
      const { rows } = await pool.query(ATTRIBUTION_SQL, params)
      res.status(200).json({ view, days: +days, lookback_days: LOOKBACK_DAYS, conversion_events: CONVERSION_EVENTS, channels: rows })
    } else if (view === 'campaigns') {
      const { rows } = await pool.query(CAMPAIGNS_SQL, params)
      res.status(200).json({ view, days: +days, campaigns: rows })
    } else if (view === 'quality') {
      const { rows } = await pool.query(QUALITY_SQL, params)
      res.status(200).json({ view, days: +days, ...rows[0] })
    } else if (view === 'export') {
      const { rows } = await pool.query(EXPORT_SQL, params)
      const siteUrl = process.env.SITE_URL || 'https://cjportfolio-inky.vercel.app'
      res.status(200).json({ view, days: +days, dry_run: true, conversions: rows.length, payloads: buildExport(rows, siteUrl) })
    } else {
      res.status(400).json({ error: 'Unknown view' })
    }
  } catch (err) {
    console.error('attribution error:', err)
    res.status(500).json({ error: 'Database error' })
  }
}
