/**
 * Edge Function: api-courses
 * Serves courses from Supabase.
 * Cache: 5 minutes
 */

export default async function handler(req, context) {
  const url = new URL(req.url)
  const slug = url.pathname.replace(/^\/api\/courses\/?/, '').replace(/\/$/, '')

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
      `${supabaseUrl}/rest/v1/courses?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const data = await resp.json()
    const course = data[0] || null

    if (!course) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(course), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // List courses
  const limit = url.searchParams.get('limit') || '20'
  const queryUrl = `${supabaseUrl}/rest/v1/courses?status=eq.published&order=start_date.asc&limit=${limit}&select=*`

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
