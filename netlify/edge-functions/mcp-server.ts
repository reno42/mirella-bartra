/**
 * MCP Server — Model Context Protocol endpoint for AI integration.
 * Exposes content, user data, and admin operations via JSON-RPC 2.0.
 *
 * Per Objetivo.md: MCP-first for admins (100% content), users (profile + SEO).
 * Compatible with Claude, OpenClaw, Hermes, and other MCP clients.
 *
 * Endpoint: /api/mcp
 * Method: POST
 * Content-Type: application/json
 */

interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

// ─── Supabase client (lightweight fetch wrapper) ───────────────────────────
function supabaseFetch(endpoint: string, opts?: { method?: string; body?: unknown }) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${endpoint}`
  const headers: Record<string, string> = {
    apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
    Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
  }
  if (opts?.body) {
    headers['Content-Type'] = 'application/json'
    headers['Prefer'] = 'return=representation'
  }
  return fetch(url, { method: opts?.method || 'GET', headers, body: opts?.body ? JSON.stringify(opts.body) : undefined })
}

// ─── Auth check ─────────────────────────────────────────────────────────────
async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') || '', Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) return null
    return await resp.json()
  } catch { return null }
}

async function isAdmin(req: Request) {
  const user = await getUser(req)
  if (!user) return false
  const resp = await supabaseFetch(`profiles?id=eq.${user.id}&select=role`)
  const data = await resp.json()
  return data?.[0]?.role === 'admin'
}

// ─── Tool Implementations ───────────────────────────────────────────────────

const tools: Record<string, (params: Record<string, unknown>, req: Request) => Promise<unknown>> = {
  // Public read-only tools
  async get_articles(params) {
    const limit = params.limit || 20
    const category = params.category || ''
    const featured = params.featured
    let q = `articles?status=eq.published&order=published_at.desc&limit=${limit}&select=*`
    if (category) q += `&articleSection=eq.${encodeURIComponent(String(category))}`
    if (featured === true) q += '&is_featured=eq.true'
    const resp = await supabaseFetch(q)
    return resp.json()
  },

  async get_article(params) {
    const slug = params.slug
    if (!slug) throw { code: -32602, message: 'Missing param: slug' }
    const resp = await supabaseFetch(`articles?slug=eq.${slug}&status=eq.published&select=*`)
    const data = await resp.json()
    return data[0] || null
  },

  async get_courses(params) {
    const limit = params.limit || 20
    const resp = await supabaseFetch(`courses?status=eq.published&order=start_date.asc&limit=${limit}&select=*`)
    return resp.json()
  },

  async get_course(params) {
    const slug = params.slug
    if (!slug) throw { code: -32602, message: 'Missing param: slug' }
    const resp = await supabaseFetch(`courses?slug=eq.${slug}&status=eq.published&select=*`)
    const data = await resp.json()
    return data[0] || null
  },

  async get_events(params) {
    const upcoming = params.upcoming
    let q = 'events?order=start_date.asc&select=*'
    if (upcoming) q += '&event_status=in.(upcoming,ongoing)'
    const resp = await supabaseFetch(q)
    return resp.json()
  },

  async get_event(params) {
    const slug = params.slug
    if (!slug) throw { code: -32602, message: 'Missing param: slug' }
    const resp = await supabaseFetch(`events?slug=eq.${slug}&select=*`)
    const data = await resp.json()
    return data[0] || null
  },

  async get_directory(params) {
    const specialty = params.specialty || ''
    const city = params.city || ''
    let q = 'directory?status=eq.published&consent_given=eq.true&order=full_name&select=*'
    if (specialty) q += `&specialty=eq.${encodeURIComponent(String(specialty))}`
    if (city) q += `&city=eq.${encodeURIComponent(String(city))}`
    const resp = await supabaseFetch(q)
    return resp.json()
  },

  async get_therapist(params) {
    const slug = params.slug
    if (!slug) throw { code: -32602, message: 'Missing param: slug' }
    const resp = await supabaseFetch(`directory?slug=eq.${slug}&select=*`)
    const data = await resp.json()
    return data[0] || null
  },

  async get_faqs(params) {
    const pageName = params.page || 'home'
    const resp = await supabaseFetch(`faqs?publicado=eq.true&pagina=eq.${pageName}&order=orden.asc&select=*`)
    return resp.json()
  },

  async get_testimonials() {
    const resp = await supabaseFetch('testimonials?status=eq.published&order=created_at.desc&select=*')
    return resp.json()
  },

  async get_config(params) {
    const key = params.key || ''
    const q = key ? `cms_config?id=eq.${key}&select=*` : 'cms_config?select=*'
    const resp = await supabaseFetch(q)
    const data = await resp.json()
    return key ? (data[0]?.value || null) : data
  },

  async get_b2b_programs() {
    const resp = await supabaseFetch('b2b_programs?status=eq.published&order=created_at.desc&select=*')
    return resp.json()
  },

  async search(params) {
    const query = params.query
    if (!query) throw { code: -32602, message: 'Missing param: query' }
    // Search across articles + courses + directory
    const [art, cour, dir] = await Promise.all([
      supabaseFetch(`articles?status=eq.published&or=(title.ilike.%25${query}%25,description.ilike.%25${query}%25)&limit=10&select=id,title,slug,articleSection`).then(r => r.json()),
      supabaseFetch(`courses?status=eq.published&or=(title.ilike.%25${query}%25,description.ilike.%25${query}%25)&limit=5&select=id,title,slug`).then(r => r.json()),
      supabaseFetch(`directory?status=eq.published&or=(full_name.ilike.%25${query}%25,specialty.ilike.%25${query}%25)&limit=5&select=id,full_name,slug,specialty`).then(r => r.json()),
    ])
    return { articles: art, courses: cour, directory: dir }
  },

  async get_specialties() {
    const resp = await supabaseFetch('categories?order=sort_order&select=*')
    return resp.json()
  },

  // ─── Admin tools (require auth) ─────────────────────────────────────────

  async get_metrics(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized: admin required' }
    const [articles, enrollments, subscribers, leads, events] = await Promise.all([
      supabaseFetch('articles?select=id&limit=0').then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
      supabaseFetch('course_enrollments?select=id&limit=0').then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
      supabaseFetch('subscribers?is_active=eq.true&select=id&limit=0').then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
      supabaseFetch('leads?status=eq.nuevo&select=id&limit=0').then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
      supabaseFetch('events?event_status=in.(upcoming,ongoing)&select=id&limit=0').then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
    ])
    return {
      totalArticles: parseInt(articles),
      totalEnrollments: parseInt(enrollments),
      totalSubscribers: parseInt(subscribers),
      newLeads: parseInt(leads),
      upcomingEvents: parseInt(events),
    }
  },

  async create_article(params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('articles', { method: 'POST', body: params })
    return resp.json()
  },

  async update_article(params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const { id, ...updates } = params
    if (!id) throw { code: -32602, message: 'Missing param: id' }
    const resp = await supabaseFetch(`articles?id=eq.${id}`, { method: 'PATCH', body: { ...updates, updated_at: new Date().toISOString() } })
    return resp.json()
  },

  async delete_article(params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const { id } = params
    if (!id) throw { code: -32602, message: 'Missing param: id' }
    const resp = await supabaseFetch(`articles?id=eq.${id}`, { method: 'DELETE' })
    return { deleted: resp.ok }
  },

  async get_all_articles(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('articles?order=created_at.desc&select=*')
    return resp.json()
  },

  async get_all_courses(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('courses?order=created_at.desc&select=*')
    return resp.json()
  },

  async get_all_events(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('events?order=start_date.desc&select=*')
    return resp.json()
  },

  async get_all_directory(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('directory?order=created_at.desc&select=*')
    return resp.json()
  },

  async get_leads(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('leads?order=created_at.desc&select=*')
    return resp.json()
  },

  async get_subscribers(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('subscribers?order=subscribed_at.desc&select=*')
    return resp.json()
  },

  async get_deposits(params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const status = params.status || ''
    const q = status ? `deposits?status=eq.${status}&order=created_at.desc&select=*` : 'deposits?order=created_at.desc&select=*'
    const resp = await supabaseFetch(q)
    return resp.json()
  },

  async get_bidding(_params, req) {
    if (!(await isAdmin(req))) throw { code: -32001, message: 'Unauthorized' }
    const resp = await supabaseFetch('directory?order=bid_amount.desc&select=id,full_name,specialty,bid_amount,bid_position')
    return resp.json()
  },

  // Profile (user scope)
  async get_my_profile(_params, req) {
    const user = await getUser(req)
    if (!user) throw { code: -32001, message: 'Authentication required' }
    const resp = await supabaseFetch(`profiles?id=eq.${user.id}&select=*`)
    const data = await resp.json()
    return data[0] || null
  },

  async update_my_profile(params, req) {
    const user = await getUser(req)
    if (!user) throw { code: -32001, message: 'Authentication required' }
    const resp = await supabaseFetch(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: params })
    return resp.json()
  },

  async get_my_metrics(_params, req) {
    const user = await getUser(req)
    if (!user) throw { code: -32001, message: 'Authentication required' }
    // Return profile views, clicks, etc.
    const resp = await supabaseFetch(`directory_metrics?profile_id=eq.${user.id}&select=*`)
    return resp.json()
  },
}

// ─── List tools definition ──────────────────────────────────────────────────

function getToolDefinitions() {
  return [
    { name: 'get_articles', description: 'Lista artículos publicados. Filtra por categoría, featured, límite.', parameters: { limit: 'number (default 20)', category: 'string (Noticias/Papers)', featured: 'boolean' } },
    { name: 'get_article', description: 'Obtiene un artículo por slug.', parameters: { slug: 'string (required)' } },
    { name: 'get_courses', description: 'Lista cursos publicados.', parameters: { limit: 'number' } },
    { name: 'get_course', description: 'Obtiene un curso por slug.', parameters: { slug: 'string (required)' } },
    { name: 'get_events', description: 'Lista eventos. upcoming=true para solo futuros/en curso.', parameters: { upcoming: 'boolean' } },
    { name: 'get_event', description: 'Obtiene un evento por slug.', parameters: { slug: 'string (required)' } },
    { name: 'get_directory', description: 'Busca terapeutas en el directorio.', parameters: { specialty: 'string', city: 'string' } },
    { name: 'get_therapist', description: 'Obtiene un terapeuta por slug.', parameters: { slug: 'string (required)' } },
    { name: 'get_faqs', description: 'Obtiene FAQs de una página.', parameters: { page: 'string (default "home")' } },
    { name: 'get_testimonials', description: 'Lista testimonios publicados.', parameters: {} },
    { name: 'get_config', description: 'Obtiene configuración del sitio. Sin key = todas.', parameters: { key: 'string (optional)' } },
    { name: 'get_b2b_programs', description: 'Lista programas B2B publicados.', parameters: {} },
    { name: 'get_specialties', description: 'Lista especialidades/categorías.', parameters: {} },
    { name: 'search', description: 'Búsqueda global en artículos, cursos y directorio.', parameters: { query: 'string (required)' } },
    { name: 'get_metrics', description: '[Admin] Métricas del dashboard.', parameters: {} },
    { name: 'get_all_articles', description: '[Admin] Todos los artículos (incluye drafts).', parameters: {} },
    { name: 'get_all_courses', description: '[Admin] Todos los cursos (incluye drafts).', parameters: {} },
    { name: 'get_all_events', description: '[Admin] Todos los eventos.', parameters: {} },
    { name: 'get_all_directory', description: '[Admin] Todas las entradas del directorio.', parameters: {} },
    { name: 'get_leads', description: '[Admin] Lista de leads.', parameters: {} },
    { name: 'get_subscribers', description: '[Admin] Lista de suscriptores.', parameters: {} },
    { name: 'get_deposits', description: '[Admin] Lista de depósitos. Filtra por status.', parameters: { status: 'string (pending/approved/rejected)' } },
    { name: 'get_bidding', description: '[Admin] Ranking de pujas del directorio.', parameters: {} },
    { name: 'create_article', description: '[Admin] Crea un artículo.', parameters: { title: 'string', slug: 'string', content: 'string', status: 'string', articleSection: 'string' } },
    { name: 'update_article', description: '[Admin] Actualiza un artículo.', parameters: { id: 'number (required)', title: 'string', slug: 'string', content: 'string' } },
    { name: 'delete_article', description: '[Admin] Elimina un artículo.', parameters: { id: 'number (required)' } },
    { name: 'get_my_profile', description: '[User] Obtiene el perfil del usuario autenticado.', parameters: {} },
    { name: 'update_my_profile', description: '[User] Actualiza el perfil del usuario autenticado.', parameters: { full_name: 'string', specialty: 'string', city: 'string' } },
    { name: 'get_my_metrics', description: '[User] Métricas del perfil del usuario.', parameters: {} },
  ]
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req: Request) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Only POST
  if (req.method !== 'POST') {
    // If GET, return tool list for discovery
    if (req.method === 'GET') {
      return new Response(JSON.stringify({
        name: 'mirella-mcp',
        version: '1.0.0',
        description: 'Mirella Bartra MCP Server — Content, Directory, Courses, Events, Admin tools.',
        endpoint: '/api/mcp',
        tools: getToolDefinitions(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  let body: MCPRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const response: MCPResponse = { jsonrpc: '2.0', id: body.id }

  // Handle list_tools request
  if (body.method === 'list_tools') {
    response.result = { tools: getToolDefinitions() }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Execute tool
  const toolFn = tools[body.method]
  if (!toolFn) {
    response.error = { code: -32601, message: `Method not found: ${body.method}` }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    response.result = await toolFn(body.params || {}, req)
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      response.error = { code: (err as { code: number }).code, message: (err as { message: string }).message }
    } else {
      response.error = { code: -32603, message: err instanceof Error ? err.message : 'Internal error' }
    }
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
