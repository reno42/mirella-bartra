/**
 * Edge Function: api-articles
 * Serves published articles from Supabase with full SEO metadata.
 * Cache: 5 minutes
 */

export default async function handler(req, context) {
  const url = new URL(req.url)
  const slug = url.pathname.replace(/^\/api\/articles\/?/, '').replace(/\/$/, '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (slug) {
    // Single article by slug
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/articles?slug=eq.${slug}&status=eq.published&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const data = await resp.json()
    const article = data[0] || null

    if (!article) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(article), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  // List articles
  const limit = url.searchParams.get('limit') || '20'
  const category = url.searchParams.get('category')
  const featured = url.searchParams.get('featured')

  let queryUrl = `${supabaseUrl}/rest/v1/articles?status=eq.published&order=published_at.desc&limit=${limit}&select=*`
  if (category) queryUrl += `&articleSection=eq.${encodeURIComponent(category)}`
  if (featured === 'true') queryUrl += '&is_featured=eq.true'

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
