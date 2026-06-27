/**
 * Edge Function: api-config
 * Returns public site configuration (for LLMs, javascript embeds, etc.).
 * Cache: 10 minutes
 */

export default async function handler(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch public config entries
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/cms_config?select=*`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )

  const configs = await resp.json()

  // Format as key-value map
  const config: Record<string, unknown> = {}
  for (const entry of configs) {
    if (entry.key) {
      config[entry.key] = entry.value
    }
  }

  return new Response(JSON.stringify({
    site_name: 'Mirella Bartra',
    site_url: 'https://mirellabartra.com',
    description: 'Portal de terapia de lenguaje: noticias, cursos, congresos y comunidad profesional',
    config,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
