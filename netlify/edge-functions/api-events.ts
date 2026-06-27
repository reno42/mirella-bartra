/**
 * Edge Function: api-events
 * Serves events with status calculation from Supabase.
 * Cache: 5 minutes
 */

export default async function handler(req, context) {
  const url = new URL(req.url)
  const slug = url.pathname.replace(/^\/api\/events\/?/, '').replace(/\/$/, '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (slug) {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const data = await resp.json()
    const event = data[0] || null

    if (!event) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(event), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // List events
  const upcoming = url.searchParams.get('upcoming')
  let queryUrl = `${supabaseUrl}/rest/v1/events?order=start_date.asc&limit=50&select=*`
  if (upcoming === 'true') queryUrl += '&event_status=in.(upcoming,ongoing)'

  const resp = await fetch(queryUrl, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  })
  const data = await resp.json()

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
