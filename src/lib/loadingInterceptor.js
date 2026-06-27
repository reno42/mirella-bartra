/**
 * Tracks in-flight Supabase REST API requests to coordinate global loading state.
 * Monkey-patches window.fetch to detect Supabase calls.
 */

const SUPABASE_URL = 'fcgcqkocpkycvqmxmoig.supabase.co'
const listeners = new Set()

let inFlightCount = 0

function notify() {
  for (const cb of listeners) cb({ loading: inFlightCount > 0, count: inFlightCount })
}

const _originalFetch = window.fetch

window.fetch = function patchedFetch(input, init) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url || ''
  const isSupabaseCall = url.includes(SUPABASE_URL) && url.includes('/rest/')

  if (isSupabaseCall) {
    inFlightCount++
    notify()

    return _originalFetch.apply(this, [input, init]).finally(() => {
      inFlightCount = Math.max(0, inFlightCount - 1)
      notify()
    })
  }

  return _originalFetch.apply(this, [input, init])
}

export function onLoadingChange(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function getLoadingState() {
  return { loading: inFlightCount > 0, count: inFlightCount }
}
