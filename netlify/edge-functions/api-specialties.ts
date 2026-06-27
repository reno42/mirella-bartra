/**
 * Edge Function: api-specialties
 * Returns distinct list of specialties used across articles, courses, and directory.
 * Cache: 10 minutes
 */

export default async function handler(req, context) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch unique specialties from categories table
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/categories?order=sort_order&select=*`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )
  const data = await resp.json()

  // Also fetch distinct article sections
  const articlesResp = await fetch(
    `${supabaseUrl}/rest/v1/articles?status=eq.published&select=articleSection&order=articleSection`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )
  const articles = await articlesResp.json()
  const sections = [...new Set(articles.map(a => a.articleSection).filter(Boolean))]

  return new Response(JSON.stringify({
    categories: data,
    sections,
    specialties: [
      'lenguaje', 'habla', 'voz', 'audicion', 'deglucion',
      'neuropsicologia', 'educacion', 'investigacion',
    ],
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
