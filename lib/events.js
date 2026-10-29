// Shared by api/track.js and api/attribution.js: the event taxonomy (the
// single source of truth for event names), the table schema, and the SQL
// channel-classification rule. Keeping names and channel logic in one place
// is the point — product, CRM, and ad-platform reporting all drift apart the
// moment each one defines "a conversion" or "paid social" on its own.

const { Pool } = require('pg')

// snake_case, object_action. Anything not listed is rejected at ingestion.
const EVENT_TAXONOMY = {
  page_view:         { conversion: false, props: ['is_landing', 'title'] },
  contact_click:     { conversion: true,  props: ['method'] },
  outbound_click:    { conversion: false, props: ['host'] },
  chat_message_sent: { conversion: false, props: ['canned'] },
}

const CONVERSION_EVENTS = Object.keys(EVENT_TAXONOMY).filter(n => EVENT_TAXONOMY[n].conversion)

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS site_events (
    event_id       uuid PRIMARY KEY,
    event_name     text NOT NULL,
    occurred_at    timestamptz NOT NULL,
    received_at    timestamptz NOT NULL DEFAULT now(),
    anonymous_id   text NOT NULL,
    session_id     text,
    page_path      text,
    referrer_host  text,
    utm_source     text,
    utm_medium     text,
    utm_campaign   text,
    utm_content    text,
    utm_term       text,
    click_id_type  text,
    click_id       text,
    fbc            text,
    first_touch    jsonb,
    consent_ads    boolean NOT NULL DEFAULT false,
    props          jsonb NOT NULL DEFAULT '{}'::jsonb
  );
  CREATE INDEX IF NOT EXISTS site_events_anon_time ON site_events (anonymous_id, occurred_at);
  CREATE INDEX IF NOT EXISTS site_events_name_time ON site_events (event_name, occurred_at);
`

// One channel definition, applied in SQL so every report agrees.
// Order matters: paid click IDs beat UTMs, UTMs beat referrer.
const CHANNEL_SQL = `
  CASE
    WHEN click_id_type IN ('gclid', 'gbraid', 'wbraid', 'msclkid') THEN 'paid_search'
    WHEN click_id_type IN ('fbclid', 'ttclid', 'li_fat_id') THEN 'paid_social'
    WHEN utm_source = 'recruiter' THEN 'recruiter_link'
    WHEN utm_medium IN ('cpc', 'ppc', 'paid_search') THEN 'paid_search'
    WHEN utm_medium IN ('paid_social', 'paidsocial') THEN 'paid_social'
    WHEN utm_medium = 'email' THEN 'email'
    WHEN utm_source IS NOT NULL THEN 'other_campaign'
    WHEN referrer_host ~ '(google|bing|duckduckgo|yahoo)\\.' THEN 'organic_search'
    WHEN referrer_host ~ '(linkedin|lnkd)\\.' THEN 'linkedin_organic'
    WHEN referrer_host ~ '(facebook|instagram|t\\.co|twitter|x\\.com|reddit)' THEN 'organic_social'
    WHEN referrer_host IS NOT NULL THEN 'referral'
    ELSE 'direct'
  END
`

let pool
let schemaReady
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }
  return pool
}

// Created lazily once per cold start so a fresh Neon branch just works.
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(SCHEMA_SQL).catch(err => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

module.exports = { EVENT_TAXONOMY, CONVERSION_EVENTS, CHANNEL_SQL, getPool, ensureSchema }
