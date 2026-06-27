/**
 * Date utilities — parse dates as local to avoid UTC timezone shift bugs.
 */

export function parseLocalDate(dateStr) {
  if (!dateStr) return null
  // Append T00:00:00 to force local midnight instead of UTC
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return d
}

export function formatDate(dateStr, locale = 'es-PE') {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(dateStr, locale = 'es-PE') {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr, locale = 'es-PE') {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isDateInPast(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return false
  return d < new Date()
}

export function isDateInFuture(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return false
  return d >= new Date()
}

export function daysUntil(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return null
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
