/**
 * Google Consent Mode v2 — Consent Manager
 * Handles granular opt-in for analytics, ads, and personalization.
 */

const CONSENT_KEY = 'mirella_consent'
const GA_MEASUREMENT_ID = 'G-MEASUREMENT-ID' // Replace with actual GA4 ID

export const CONSENT_DEFAULTS = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
}

export function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasConsent() {
  return getStoredConsent() !== null
}

export function acceptAll() {
  const consent = {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted',
  }
  storeAndApply(consent)
}

export function acceptEssentialOnly() {
  storeAndApply({ ...CONSENT_DEFAULTS })
}

export function storeAndApply(consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  applyConsent(consent)
}

export function applyConsent(consent) {
  // Update Google Consent Mode
  window.gtag?.('consent', 'update', consent)

  // Load GA only after analytics consent
  if (consent.analytics_storage === 'granted') {
    loadGoogleAnalytics()
  } else {
    removeGoogleAnalytics()
  }
}

function loadGoogleAnalytics() {
  if (document.getElementById('ga-script')) return

  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script1.id = 'ga-script'

  const script2 = document.createElement('script')
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `

  document.head.appendChild(script1)
  document.head.appendChild(script2)
}

function removeGoogleAnalytics() {
  document.getElementById('ga-script')?.remove()
  // Also remove any injected GA cookies by expiring them
  document.cookie.split(';').forEach(c => {
    const name = c.split('=')[0].trim()
    if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  })
}

export function clearConsent() {
  localStorage.removeItem(CONSENT_KEY)
  applyConsent(CONSENT_DEFAULTS)
}

/**
 * Initialize consent on app start.
 * Reads stored consent and applies it; if none stored, defaults to denied.
 */
export function initConsent() {
  const stored = getStoredConsent()
  if (stored) {
    applyConsent(stored)
  } else {
    applyConsent(CONSENT_DEFAULTS)
  }
}
