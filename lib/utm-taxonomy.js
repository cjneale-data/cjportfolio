// The UTM taxonomy for this site: the controlled vocabulary every tagged link
// is supposed to follow, the rules that check a landing against it, and the
// channel grouping built on top of it. /api/journeys serves TAXONOMY to the
// browser, so the link builder and the live report read the same copy.
//
// Raw UTM values are stored as they arrive (see api/track.js) and judged here
// at read time. A typo is flagged, never dropped, so a fix to the taxonomy
// re-classifies old traffic instead of losing it.

// utm_source: who sent the visit. Each source lists the mediums it can pair with.
const SOURCES = {
  google:     { label: 'Google',     mediums: ['cpc', 'display'] },
  bing:       { label: 'Bing',       mediums: ['cpc'] },
  meta:       { label: 'Meta',       mediums: ['paid_social', 'organic_social'] },
  linkedin:   { label: 'LinkedIn',   mediums: ['paid_social', 'organic_social'] },
  tiktok:     { label: 'TikTok',     mediums: ['paid_social', 'organic_social'] },
  reddit:     { label: 'Reddit',     mediums: ['paid_social', 'organic_social'] },
  newsletter: { label: 'Newsletter', mediums: ['email'] },
  github:     { label: 'GitHub',     mediums: ['referral'] },
  print:      { label: 'Print',      mediums: ['qr'] },
}

// utm_medium: the kind of channel. This is what drives the channel grouping.
const MEDIUMS = {
  cpc:            { label: 'Paid search (cost per click)', channel: 'Paid Search' },
  display:        { label: 'Display banners',              channel: 'Display' },
  paid_social:    { label: 'Paid social ads',              channel: 'Paid Social' },
  organic_social: { label: 'Unpaid social posts',          channel: 'Organic Social' },
  email:          { label: 'Email',                        channel: 'Email' },
  referral:       { label: 'Links from other sites',       channel: 'Referral' },
  qr:             { label: 'QR codes on print',            channel: 'Offline (QR)' },
}

// utm_campaign: {year}{quarter}_{objective}_{descriptor}
const CAMPAIGN_PATTERN = '^(20\\d{2})(q[1-4])_(awareness|consideration|conversion|retention)_([a-z0-9]+(?:_[a-z0-9]+)*)$'
const OBJECTIVES = ['awareness', 'consideration', 'conversion', 'retention']

// Campaigns are registered before a link goes out, so the report can tell a
// real campaign from a one-off someone typed by hand.
const CAMPAIGNS = {
  '2026q4_awareness_portfolio_launch':   'Launch posts for this portfolio',
  '2026q4_consideration_case_studies':   'Sharing individual case studies',
  '2026q4_conversion_contact_cta':       'Posts that ask readers to get in touch',
  '2026q4_awareness_utm_lab_demo':       'Links made with the builder on the tracker page',
}

// utm_content: which creative or placement inside the campaign.
const CONTENTS = {
  text_link:     'Plain text link',
  cta_button:    'Call-to-action button',
  profile_link:  'Link in a profile or bio',
  video_15s:     '15-second video ad',
  carousel:      'Carousel ad',
  header_banner: 'Banner placement',
  qr_poster:     'QR code on a poster',
}

const RULES = [
  { code: 'case',                 text: 'Values are lowercase snake_case: no capitals, spaces, or hyphens.' },
  { code: 'missing_medium',       text: 'Every tagged link sets utm_medium.' },
  { code: 'missing_campaign',     text: 'Every tagged link sets utm_campaign.' },
  { code: 'unknown_source',       text: 'utm_source comes from the source list.' },
  { code: 'unknown_medium',       text: 'utm_medium comes from the medium list.' },
  { code: 'pair',                 text: 'The medium is one that source allows (meta + email is not a real channel).' },
  { code: 'campaign_pattern',     text: 'utm_campaign follows {year}{quarter}_{objective}_{descriptor}.' },
  { code: 'campaign_unregistered', text: 'utm_campaign is registered before the link goes out.' },
  { code: 'unknown_content',      text: 'utm_content comes from the creative list.' },
]

const TAXONOMY = { SOURCES, MEDIUMS, CAMPAIGN_PATTERN, OBJECTIVES, CAMPAIGNS, CONTENTS, RULES }

const campaignRe = new RegExp(CAMPAIGN_PATTERN)
const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k)

// "Paid Social" or "paid-social " -> "paid_social", for matching messy input.
function normalize(v) {
  return String(v).trim().toLowerCase().replace(/[\s-]+/g, '_')
}

// Check one landing's UTMs. status: untagged | valid | invalid.
function checkTouch(t) {
  const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
  if (!fields.some(f => t[f])) return { status: 'untagged', issues: [] }

  const issues = new Set()
  const n = {}
  for (const f of fields) {
    if (!t[f]) continue
    n[f] = normalize(t[f])
    if (n[f] !== t[f]) issues.add('case')
  }
  if (!n.utm_medium) issues.add('missing_medium')
  if (!n.utm_campaign) issues.add('missing_campaign')
  if (n.utm_source && !has(SOURCES, n.utm_source)) issues.add('unknown_source')
  if (n.utm_medium && !has(MEDIUMS, n.utm_medium)) issues.add('unknown_medium')
  if (has(SOURCES, n.utm_source) && has(MEDIUMS, n.utm_medium) && !SOURCES[n.utm_source].mediums.includes(n.utm_medium)) {
    issues.add('pair')
  }
  if (n.utm_campaign) {
    if (!campaignRe.test(n.utm_campaign)) issues.add('campaign_pattern')
    else if (!has(CAMPAIGNS, n.utm_campaign)) issues.add('campaign_unregistered')
  }
  if (n.utm_content && !has(CONTENTS, n.utm_content)) issues.add('unknown_content')

  return { status: issues.size ? 'invalid' : 'valid', issues: [...issues] }
}

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu)\./
const SOCIAL_HOSTS = /(^|\.)(linkedin\.com|lnkd\.in|facebook\.com|instagram\.com|t\.co|x\.com|twitter\.com|reddit\.com|tiktok\.com|threads\.net)$/

// Default channel grouping. Order matters: an ad click ID beats UTMs, and
// UTMs beat the referrer.
function channelFor(t) {
  if (['gclid', 'gbraid', 'wbraid', 'msclkid'].includes(t.click_id_type)) return 'Paid Search'
  if (['fbclid', 'ttclid', 'li_fat_id'].includes(t.click_id_type)) return 'Paid Social'
  const medium = t.utm_medium && normalize(t.utm_medium)
  if (medium && has(MEDIUMS, medium)) return MEDIUMS[medium].channel
  if (t.utm_source || t.utm_medium || t.utm_campaign) return 'Unclassified Campaign'
  const ref = t.referrer_host || ''
  if (SEARCH_HOSTS.test(ref)) return 'Organic Search'
  if (SOCIAL_HOSTS.test(ref)) return 'Organic Social'
  if (ref) return 'Referral'
  return 'Direct'
}

// What the public dashboard may show. Anything outside the taxonomy is
// replaced with a label, so a hand-typed link can't put arbitrary text on
// the page, and utm_term (search keywords) is never shown.
function publicTouch(t) {
  const known = (v, list) => {
    if (!v) return null
    const n = normalize(v)
    return has(list, n) ? n : '(not in taxonomy)'
  }
  let campaign = null
  if (t.utm_campaign) {
    const n = normalize(t.utm_campaign)
    campaign = has(CAMPAIGNS, n) ? n : campaignRe.test(n) ? '(unregistered)' : '(off-pattern)'
  }
  return {
    source: known(t.utm_source, SOURCES),
    medium: known(t.utm_medium, MEDIUMS),
    campaign,
    content: known(t.utm_content, CONTENTS),
    referrer: publicReferrer(t.referrer_host),
    ad_click: t.click_id_type ? t.click_id_type : null,
  }
}

const KNOWN_REFERRERS = [
  [SEARCH_HOSTS, h => h.match(SEARCH_HOSTS)[2]],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, () => 'linkedin'],
  [/(^|\.)github\.com$/, () => 'github'],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, () => 'x'],
  [/(^|\.)reddit\.com$/, () => 'reddit'],
  [/(^|\.)(facebook\.com|instagram\.com)$/, () => 'meta'],
  [/(^|\.)news\.ycombinator\.com$/, () => 'hacker news'],
]
function publicReferrer(host) {
  if (!host) return null
  for (const [re, name] of KNOWN_REFERRERS) if (re.test(host)) return name(host)
  return 'another site'
}

module.exports = { TAXONOMY, checkTouch, channelFor, publicTouch, normalize }
