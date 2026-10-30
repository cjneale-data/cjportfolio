// First-party event tracking for this site — the client half of the
// UTM Journey Tracker (see #/project/utm-journeys, api/track.js, and journeys.html).
//
// What it does:
//   - Captures UTM params and ad-platform click IDs on landing, keeps a
//     first-touch record, and attaches the current touch to every event.
//   - Sends events to /api/track (same origin, no third-party pixels).
//   - Every event gets a client-generated event_id, so the server can dedupe
//     retries the same way a Conversions API dedupes browser + server events.
//   - Privacy: honors Global Privacy Control / Do Not Track by dropping ad
//     click IDs and marking the event consent_ads=false (never exported).
//     No cookies, no IP, no fingerprinting.
//
// Public API: window.siteTrack(eventName, props)

(function(){
  const ENDPOINT = '/api/track'
  const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'li_fat_id', 'msclkid']
  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

  // Local dev shouldn't pollute the production event table.
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:'

  const consentAds = !(navigator.globalPrivacyControl === true || navigator.doNotTrack === '1')

  function store(kind){
    try { return window[kind] } catch(e) { return null }
  }
  function get(kind, key){
    try { return store(kind) && store(kind).getItem(key) } catch(e) { return null }
  }
  function set(kind, key, value){
    try { store(kind) && store(kind).setItem(key, value) } catch(e) {}
  }

  function uuid(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  const anonymousId = get('localStorage', 'st_aid') || uuid()
  set('localStorage', 'st_aid', anonymousId)

  // A new session = a landing. Only landings carry attribution touches.
  let sessionId = get('sessionStorage', 'st_sid')
  const isLanding = !sessionId
  if (!sessionId) {
    sessionId = uuid()
    set('sessionStorage', 'st_sid', sessionId)
  }

  function readTouch(){
    const params = new URLSearchParams(location.search)
    const touch = {}
    UTM_PARAMS.forEach(p => { if (params.get(p)) touch[p] = params.get(p).slice(0, 200) })
    if (consentAds) {
      for (const p of CLICK_ID_PARAMS) {
        if (params.get(p)) {
          touch.click_id_type = p
          touch.click_id = params.get(p).slice(0, 500)
          // Meta's fbc format, so a Conversions API export can use it as-is.
          if (p === 'fbclid') touch.fbc = 'fb.1.' + Date.now() + '.' + touch.click_id
          break
        }
      }
    }
    let referrerHost = null
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer)
        if (ref.hostname !== location.hostname) referrerHost = ref.hostname
      }
    } catch(e) {}
    touch.referrer_host = referrerHost
    return touch
  }

  // Touch persists for the session so later events (e.g. a contact click two
  // pages in) stay tied to the campaign that brought the visitor here.
  let touch
  if (isLanding) {
    touch = readTouch()
    set('sessionStorage', 'st_touch', JSON.stringify(touch))
    if (!get('localStorage', 'st_first_touch')) {
      set('localStorage', 'st_first_touch', JSON.stringify(Object.assign({at: new Date().toISOString()}, touch)))
    }
  } else {
    try { touch = JSON.parse(get('sessionStorage', 'st_touch') || '{}') } catch(e) { touch = {} }
  }

  function firstTouch(){
    try { return JSON.parse(get('localStorage', 'st_first_touch') || 'null') } catch(e) { return null }
  }

  function siteTrack(eventName, props){
    const payload = {
      event_id: uuid(),
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      anonymous_id: anonymousId,
      session_id: sessionId,
      page_path: location.pathname + location.hash,
      touch: touch,
      first_touch: firstTouch(),
      consent_ads: consentAds,
      props: props || {},
    }
    if (isLocal) {
      console.debug('[siteTrack]', payload)
      return
    }
    const body = JSON.stringify(payload)
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], {type: 'application/json'}))) return
    } catch(e) {}
    fetch(ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {})
  }

  window.siteTrack = siteTrack

  siteTrack('page_view', {is_landing: isLanding, title: document.title})

  // The main site is a hash router — count each route as a page view.
  let lastHash = location.hash
  window.addEventListener('hashchange', function(){
    if (location.hash === lastHash) return
    lastHash = location.hash
    siteTrack('page_view', {is_landing: false, title: document.title})
  })

  // Contact intent is this site's conversion event. Outbound clicks to the
  // live demos are tracked separately so they don't inflate conversions.
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href')
    if (/^mailto:/i.test(href)) siteTrack('contact_click', {method: 'email'})
    else if (/^tel:/i.test(href)) siteTrack('contact_click', {method: 'phone'})
    else if (/linkedin\.com/i.test(href)) siteTrack('contact_click', {method: 'linkedin'})
    else if (/^https?:/i.test(href) && a.hostname !== location.hostname) siteTrack('outbound_click', {host: a.hostname})
  }, true)
})()
