/**
 * Edge Function: api-directory
 * Serves therapist directory entries from Supabase.
 * Cache: 5 minutes
 */

export default async function handler(req, context) {
  const url = new URL(req.url)
  const slug = url.pathname.replace(/^\/api\/directory\/?/, '').replace(/\/$/, '')

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
      `${supabaseUrl}/rest/v1/directory?slug=eq.${encodeURIComponent(slug)}&status=eq.published&consent_given=eq.true&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const data = await resp.json()
    const entry = data[0] || null

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // List directory
  const specialty = url.searchParams.get('specialty')
  const city = url.searchParams.get('city')
  const limit = url.searchParams.get('limit') || '50'

  let queryUrl = `${supabaseUrl}/rest/v1/directory?status=eq.published&consent_given=eq.true&order=full_name&limit=${limit}&select=*`
  if (specialty) queryUrl += `&specialty=eq.${encodeURIComponent(specialty)}`
  if (city) queryUrl += `&city=eq.${encodeURIComponent(city)}`

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
