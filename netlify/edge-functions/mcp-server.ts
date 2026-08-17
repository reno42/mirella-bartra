/**
 * MCP Server — Model Context Protocol endpoint for AI integration.
 * Protocolo estándar (JSON-RPC 2.0): initialize · tools/list · tools/call
 * Compatible con Claude Desktop/Code, Cursor, OpenClaw y cualquier cliente MCP.
 *
 * Tres niveles de acceso contra /api/mcp:
 *   · PÚBLICO  — sin token: leer contenido. Límite 5 consultas/día (por IP).
 *   · USER     — token mba…/mbu… (Bearer): 20/día + gestionar SUS datos.
 *   · ADMIN    — token mba_… (Bearer): todo lo que hace un admin. Sin límite.
 *
 * Los límites se guardan en mcp_usage (día de Lima) → se reinician cada día.
 * La data se lee/escribe con SERVICE ROLE (bypass RLS) después de validar
 * el scope del token en código: el único camino de escritura es este servidor.
 */

type Scope = 'public' | 'user' | 'admin'

const LIMITS: Record<Scope, number> = { public: 5, user: 20, admin: 100000 }

interface AuthCtx {
  scope: Scope
  profile: { id: string; email: string; role: string } | null
  tokenRow: { id: string; scope: string } | null
}

interface MCPRequest {
  jsonrpc?: '2.0'
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

// ─── Supabase REST helpers ──────────────────────────────────────────────────

function env(name: string): string | undefined {
  return Deno.env.get(name)
}

function serviceKey(): string | undefined {
  return env('SUPABASE_SERVICE_ROLE_KEY')
}

function anonKey(): string {
  return env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY') || ''
}

/** Data ops: service role (bypass RLS, el scope se valida en este código). */
function sb(endpoint: string, opts: { method?: string; body?: unknown } = {}) {
  const key = serviceKey() || anonKey()
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  }
  if (opts.body) {
    headers['Content-Type'] = 'application/json'
    headers['Prefer'] = 'return=representation'
  }
  return fetch(`${env('SUPABASE_URL')}/rest/v1/${endpoint}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
}

async function sbJson(endpoint: string, opts?: { method?: string; body?: unknown }) {
  const resp = await sb(endpoint, opts)
  const text = await resp.text()
  if (!resp.ok) throw new Error(`Supabase ${resp.status}: ${text.slice(0, 300)}`)
  try { return JSON.parse(text) } catch { return text }
}

// ─── Auth: token MCP → JWT legacy → público por IP ─────────────────────────

async function getUserFromJwt(jwt: string) {
  try {
    const resp = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
      headers: { apikey: anonKey(), Authorization: `Bearer ${jwt}` },
    })
    if (!resp.ok) return null
    return await resp.json()
  } catch { return null }
}

async function resolveAuth(req: Request): Promise<AuthCtx> {
  const header = req.headers.get('Authorization') || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  // 1) Token MCP propio (mbu_/mba_): lookup directo con service key
  if (bearer.startsWith('mbu_') || bearer.startsWith('mba_')) {
    const rows = await sbJson(
      `mcp_tokens?token=eq.${encodeURIComponent(bearer)}&is_active=eq.true&select=id,scope,profile_id`,
    ).catch(() => null)
    const row = Array.isArray(rows) ? rows[0] : null
    if (!row) throw { code: -32001, message: 'Token inválido o revocado. Genera uno nuevo en mirellabartra.com/conectar-ias' }
    const profiles = await sbJson(`profiles?id=eq.${row.profile_id}&select=id,email,role`).catch(() => [])
    const profile = Array.isArray(profiles) ? profiles[0] : null
    // Fire-and-forget: registrar último uso
    sb(`mcp_tokens?id=eq.${row.id}`, { method: 'PATCH', body: { last_used_at: new Date().toISOString() } }).catch(() => {})
    return { scope: row.scope === 'admin' ? 'admin' : 'user', profile, tokenRow: { id: row.id, scope: row.scope } }
  }

  // 2) Compatibilidad: JWT de sesión de Supabase (mismo acceso que su cuenta)
  if (bearer.includes('.') && bearer.length > 40) {
    const user = await getUserFromJwt(bearer)
    if (user) {
      const profiles = await sbJson(`profiles?id=eq.${user.id}&select=id,email,role`).catch(() => [])
      const profile = Array.isArray(profiles) ? profiles[0] : null
      const isAdminRole = profile?.role === 'admin'
      return { scope: isAdminRole ? 'admin' : 'user', profile, tokenRow: null }
    }
  }

  // 3) Público: sin credenciales
  return { scope: 'public', profile: null, tokenRow: null }
}

// ─── Límite diario (día de Lima, persistido en mcp_usage) ───────────────────

function limaDay(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  )
}

async function checkAndCountUsage(auth: AuthCtx): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = LIMITS[auth.scope]
  const kind = auth.tokenRow ? 'token' : 'ip'
  const key = auth.tokenRow ? auth.tokenRow.id : clientIp(reqRef!)
  const day = limaDay()

  const rows = await sbJson(`mcp_usage?kind=eq.${kind}&key=eq.${encodeURIComponent(key)}&day=eq.${day}&select=calls`).catch(() => [])
  const calls = Array.isArray(rows) && rows[0] ? Number(rows[0].calls) : 0

  if (calls >= limit) return { allowed: false, remaining: 0, limit }

  if (calls === 0) {
    await sb('mcp_usage', { method: 'POST', body: { kind, key, day, calls: 1 } }).catch(() => {})
  } else {
    await sb(`mcp_usage?kind=eq.${kind}&key=eq.${encodeURIComponent(key)}&day=eq.${day}`, { method: 'PATCH', body: { calls: calls + 1 } }).catch(() => {})
  }
  return { allowed: true, remaining: limit - calls - 1, limit }
}

// El IP se necesita dentro de checkAndCountUsage sin pasarlo por todos lados
let reqRef: Request | null = null

// ─── Tool registry ──────────────────────────────────────────────────────────

interface ToolDef {
  description: string
  scopes: Scope[]
  schema: Record<string, unknown>
  run: (args: Record<string, unknown>, ctx: AuthCtx) => Promise<unknown>
}

function requireWriteBackend() {
  if (!serviceKey()) {
    throw { code: -32003, message: 'El servidor no tiene SUPABASE_SERVICE_ROLE_KEY configurada (variable de entorno de Netlify). Las escrituras están deshabilitadas hasta configurarla.' }
  }
}

function filterParams(params: Record<string, unknown>, allowed: string[]) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) if (allowed.includes(k) && v !== undefined) out[k] = v
  return out
}

const ADMIN_TABLES = [
  'articles', 'events', 'courses', 'directory', 'ticker_messages', 'faqs',
  'testimonials', 'subscribers', 'leads', 'deposits', 'complaints_book',
  'cms_config', 'event_registrations', 'certificates', 'b2b_programs',
]

function buildFilters(filters: Record<string, unknown>): string {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `&${k}=eq.${encodeURIComponent(String(v))}`)
    .join('')
}

const TOOLS: Record<string, ToolDef> = {
  // ═══ PÚBLICO (disponible para todos los scopes) ═══
  get_articles: {
    description: 'Lista artículos publicados (noticias y papers). Filtra por categoría y destacados.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { limit: { type: 'number', description: 'default 20, máx 50' }, category: { type: 'string', description: 'articleSection: Noticias, Papers…' }, featured: { type: 'boolean' } }, required: [] },
    run: async (p) => {
      const limit = Math.min(Number(p.limit) || 20, 50)
      let q = `articles?status=eq.published&order=published_at.desc&limit=${limit}&select=id,slug,title,description,articleSection,published_at,reading_time,featured_image`
      if (p.category) q += `&articleSection=eq.${encodeURIComponent(String(p.category))}`
      if (p.featured === true) q += '&is_featured=eq.true'
      return await sbJson(q)
    },
  },
  get_article: {
    description: 'Obtiene un artículo completo (contenido incluido) por su slug.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    run: async (p) => {
      if (!p.slug) throw { code: -32602, message: 'Falta el parámetro: slug' }
      const rows = await sbJson(`articles?slug=eq.${encodeURIComponent(String(p.slug))}&status=eq.published&select=*`)
      return rows[0] || null
    },
  },
  get_courses: {
    description: 'Lista cursos publicados.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    run: async (p) => sbJson(`courses?status=eq.published&order=start_date.asc&limit=${Math.min(Number(p.limit) || 20, 50)}&select=*`),
  },
  get_course: {
    description: 'Obtiene un curso por slug.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    run: async (p) => {
      if (!p.slug) throw { code: -32602, message: 'Falta el parámetro: slug' }
      const rows = await sbJson(`courses?slug=eq.${encodeURIComponent(String(p.slug))}&status=eq.published&select=*`)
      return rows[0] || null
    },
  },
  get_events: {
    description: 'Lista eventos y congresos. upcoming=true para solo futuros/en curso.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { upcoming: { type: 'boolean' } }, required: [] },
    run: async (p) => {
      let q = 'events?order=start_date.asc&select=*'
      if (p.upcoming) q += '&event_status=in.(upcoming,ongoing)'
      return await sbJson(q)
    },
  },
  get_event: {
    description: 'Obtiene un evento por slug.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    run: async (p) => {
      if (!p.slug) throw { code: -32602, message: 'Falta el parámetro: slug' }
      const rows = await sbJson(`events?slug=eq.${encodeURIComponent(String(p.slug))}&select=*`)
      return rows[0] || null
    },
  },
  get_directory: {
    description: 'Busca terapeutas en el directorio público por especialidad y/o ciudad.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { specialty: { type: 'string' }, city: { type: 'string' }, limit: { type: 'number' } }, required: [] },
    run: async (p) => {
      let q = `directory?status=eq.published&consent_given=eq.true&order=full_name&limit=${Math.min(Number(p.limit) || 20, 50)}&select=*`
      if (p.specialty) q += `&specialty=ilike.${encodeURIComponent(String(p.specialty))}`
      if (p.city) q += `&city=ilike.${encodeURIComponent(String(p.city))}`
      return await sbJson(q)
    },
  },
  get_therapist: {
    description: 'Obtiene un terapeuta del directorio por slug.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    run: async (p) => {
      if (!p.slug) throw { code: -32602, message: 'Falta el parámetro: slug' }
      const rows = await sbJson(`directory?slug=eq.${encodeURIComponent(String(p.slug))}&select=*`)
      return rows[0] || null
    },
  },
  get_faqs: {
    description: 'Obtiene las FAQs públicas de una página.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { page: { type: 'string', description: 'default "home"' } }, required: [] },
    run: async (p) => sbJson(`faqs?publicado=eq.true&pagina=eq.${encodeURIComponent(String(p.page || 'home'))}&order=orden.asc&select=*`),
  },
  get_testimonials: {
    description: 'Lista testimonios publicados.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('testimonials?status=eq.published&order=created_at.desc&select=*'),
  },
  get_b2b_programs: {
    description: 'Lista programas B2B publicados.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('b2b_programs?status=eq.published&order=created_at.desc&select=*'),
  },
  get_specialties: {
    description: 'Lista especialidades/categorías del sitio.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('categories?order=sort_order&select=*'),
  },
  get_ticker: {
    description: 'Frases activas de la barra superior del sitio.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('ticker_messages?is_active=eq.true&order=sort_order&select=text'),
  },
  search: {
    description: 'Búsqueda global en artículos, cursos y directorio.',
    scopes: ['public', 'user', 'admin'],
    schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    run: async (p) => {
      const q = String(p.query || '')
      if (!q) throw { code: -32602, message: 'Falta el parámetro: query' }
      const enc = encodeURIComponent(q)
      const [art, cour, dir] = await Promise.all([
        sbJson(`articles?status=eq.published&or=(title.ilike.*${enc}*,description.ilike.*${enc}*)&limit=10&select=id,title,slug,articleSection`).catch(() => []),
        sbJson(`courses?status=eq.published&or=(title.ilike.*${enc}*,description.ilike.*${enc}*)&limit=5&select=id,title,slug`).catch(() => []),
        sbJson(`directory?status=eq.published&or=(full_name.ilike.*${enc}*,specialty.ilike.*${enc}*)&limit=5&select=id,full_name,slug,specialty`).catch(() => []),
      ])
      return { articles: art, courses: cour, directory: dir }
    },
  },

  // ═══ USUARIO (requiere token de usuario o sesión) ═══
  whoami: {
    description: 'Informa quién eres en el sitio, tu scope y cuántas consultas te quedan hoy.',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async (_p, ctx) => ({
      scope: ctx.scope,
      email: ctx.profile?.email || null,
      role: ctx.profile?.role || null,
      daily_limit: LIMITS[ctx.scope] >= 100000 ? 'sin límite' : LIMITS[ctx.scope],
    }),
  },
  get_my_profile: {
    description: 'Obtiene tu perfil de cuenta.',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async (_p, ctx) => {
      const rows = await sbJson(`profiles?id=eq.${ctx.profile!.id}&select=*`)
      return rows[0] || null
    },
  },
  update_my_profile: {
    description: 'Actualiza tu perfil (nombre, especialidad, ciudad, bio).',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: { full_name: { type: 'string' }, specialty: { type: 'string' }, city: { type: 'string' }, bio: { type: 'string' } }, required: [] },
    run: async (p, ctx) => {
      requireWriteBackend()
      const data = filterParams(p, ['full_name', 'specialty', 'city', 'bio'])
      if (Object.keys(data).length === 0) throw { code: -32602, message: 'Sin campos para actualizar' }
      return await sbJson(`profiles?id=eq.${ctx.profile!.id}`, { method: 'PATCH', body: data })
    },
  },
  get_my_directory_entry: {
    description: 'Obtiene TU entrada del directorio de terapeutas (la que coincide con tu email).',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async (_p, ctx) => {
      const rows = await sbJson(`directory?email=ilike.${encodeURIComponent(ctx.profile!.email)}&select=*`)
      return rows[0] || { found: false, hint: 'No hay entrada del directorio asociada a tu email. Inscríbete en mirellabartra.com/directorio/inscribirse' }
    },
  },
  update_my_directory_entry: {
    description: 'Actualiza TU entrada del directorio (bio, ciudad, teléfono, especialidad, foto, años de experiencia).',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: { bio: { type: 'string' }, city: { type: 'string' }, phone: { type: 'string' }, specialty: { type: 'string' }, photo_url: { type: 'string' }, years_experience: { type: 'number' } }, required: [] },
    run: async (p, ctx) => {
      requireWriteBackend()
      const data = filterParams(p, ['bio', 'city', 'phone', 'specialty', 'photo_url', 'years_experience'])
      if (Object.keys(data).length === 0) throw { code: -32602, message: 'Sin campos para actualizar' }
      const rows = await sbJson(`directory?email=ilike.${encodeURIComponent(ctx.profile!.email)}&select=id`)
      if (!rows[0]) throw { code: -32002, message: 'No tienes entrada en el directorio para actualizar' }
      return await sbJson(`directory?id=eq.${rows[0].id}`, { method: 'PATCH', body: data })
    },
  },
  get_my_subscriptions: {
    description: 'Obtiene tus suscripciones (newsletter, alertas de eventos).',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async (_p, ctx) => sbJson(`subscribers?email=ilike.${encodeURIComponent(ctx.profile!.email)}&select=*`),
  },
  get_my_metrics: {
    description: 'Métricas de tu perfil en el directorio.',
    scopes: ['user', 'admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async (_p, ctx) => sbJson(`directory_metrics?profile_id=eq.${ctx.profile!.id}&select=*`).catch(() => []),
  },

  // ═══ ADMIN (todo lo que hace un admin) ═══
  get_metrics: {
    description: '[Admin] Métricas del dashboard: artículos, inscripciones, suscriptores, leads, eventos.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => {
      const count = async (ep: string) => {
        const r = await sb(`${ep}&select=id&limit=0`)
        return parseInt(r.headers.get('content-range')?.split('/')[1] || '0')
      }
      const [articles, enrollments, subscribers, leads, events] = await Promise.all([
        count('articles?'), count('course_enrollments?'),
        count('subscribers?is_active=eq.true&'), count('leads?status=eq.nuevo&'),
        count('events?event_status=in.(upcoming,ongoing)&'),
      ])
      return { totalArticles: articles, totalEnrollments: enrollments, totalSubscribers: subscribers, newLeads: leads, upcomingEvents: events }
    },
  },
  get_all_articles: {
    description: '[Admin] Todos los artículos, incluidos borradores.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    run: async (p) => sbJson(`articles?order=created_at.desc&limit=${Math.min(Number(p.limit) || 100, 500)}&select=*`),
  },
  get_all_courses: {
    description: '[Admin] Todos los cursos.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('courses?order=created_at.desc&select=*'),
  },
  get_all_events: {
    description: '[Admin] Todos los eventos.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('events?order=start_date.desc&select=*'),
  },
  get_all_directory: {
    description: '[Admin] Todas las entradas del directorio.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('directory?order=created_at.desc&select=*'),
  },
  get_leads: {
    description: '[Admin] Lista de leads.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('leads?order=created_at.desc&select=*'),
  },
  get_subscribers: {
    description: '[Admin] Lista de suscriptores.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('subscribers?order=subscribed_at.desc&select=*'),
  },
  get_deposits: {
    description: '[Admin] Depósitos. Filtra por status (pending/approved/rejected).',
    scopes: ['admin'],
    schema: { type: 'object', properties: { status: { type: 'string' } }, required: [] },
    run: async (p) => sbJson(`deposits?order=created_at.desc${p.status ? `&status=eq.${encodeURIComponent(String(p.status))}` : ''}&select=*`),
  },
  get_bidding: {
    description: '[Admin] Ranking de pujas del directorio.',
    scopes: ['admin'],
    schema: { type: 'object', properties: {}, required: [] },
    run: async () => sbJson('directory?order=bid_amount.desc&select=id,full_name,specialty,bid_amount,bid_position'),
  },
  get_config: {
    description: '[Admin] Configuración del sitio (cms_config). Sin key = toda.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { key: { type: 'string' } }, required: [] },
    run: async (p) => {
      const q = p.key ? `cms_config?id=eq.${encodeURIComponent(String(p.key))}&select=*` : 'cms_config?select=*'
      const rows = await sbJson(q)
      return p.key ? (rows[0]?.value ?? null) : rows
    },
  },
  create_article: {
    description: '[Admin] Crea un artículo.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { title: { type: 'string' }, slug: { type: 'string' }, content: { type: 'string' }, articleSection: { type: 'string' }, status: { type: 'string', description: 'draft | published' } }, required: ['title'] },
    run: async (p) => {
      requireWriteBackend()
      return await sbJson('articles', { method: 'POST', body: p })
    },
  },
  update_article: {
    description: '[Admin] Actualiza un artículo por id.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' }, status: { type: 'string' } }, required: ['id'] },
    run: async (p) => {
      requireWriteBackend()
      const { id, ...updates } = p
      if (!id) throw { code: -32602, message: 'Falta el parámetro: id' }
      return await sbJson(`articles?id=eq.${encodeURIComponent(String(id))}`, { method: 'PATCH', body: { ...updates, updated_at: new Date().toISOString() } })
    },
  },
  delete_article: {
    description: '[Admin] Elimina un artículo por id.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    run: async (p) => {
      requireWriteBackend()
      const r = await sb(`articles?id=eq.${encodeURIComponent(String(p.id))}`, { method: 'DELETE' })
      return { deleted: r.ok }
    },
  },
  admin_list: {
    description: `[Admin] Lista filas de una tabla. Tablas: ${ADMIN_TABLES.join(', ')}.`,
    scopes: ['admin'],
    schema: { type: 'object', properties: { table: { type: 'string', enum: ADMIN_TABLES }, limit: { type: 'number' }, order: { type: 'string', description: 'ej: "created_at.desc" o "start_date.asc"' }, filters: { type: 'object', description: 'igualdades columna→valor' } }, required: ['table'] },
    run: async (p) => {
      if (!ADMIN_TABLES.includes(String(p.table))) throw { code: -32602, message: `Tabla no permitida. Usa: ${ADMIN_TABLES.join(', ')}` }
      const limit = Math.min(Number(p.limit) || 100, 500)
      const order = String(p.order || 'created_at.desc')
      const filters = buildFilters((p.filters as Record<string, unknown>) || {})
      return await sbJson(`${p.table}?order=${encodeURIComponent(order)}&limit=${limit}${filters}&select=*`)
    },
  },
  admin_insert: {
    description: '[Admin] Inserta filas en una tabla permitida.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { table: { type: 'string', enum: ADMIN_TABLES }, data: { type: 'object', description: 'fila u objeto {rows: [...]} para lote' } }, required: ['table', 'data'] },
    run: async (p) => {
      requireWriteBackend()
      if (!ADMIN_TABLES.includes(String(p.table))) throw { code: -32602, message: `Tabla no permitida. Usa: ${ADMIN_TABLES.join(', ')}` }
      const data = (p.data as Record<string, unknown>)?.rows || p.data
      return await sbJson(String(p.table), { method: 'POST', body: data })
    },
  },
  admin_update: {
    description: '[Admin] Actualiza filas por id en una tabla permitida.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { table: { type: 'string', enum: ADMIN_TABLES }, id: { type: 'string' }, data: { type: 'object' } }, required: ['table', 'id', 'data'] },
    run: async (p) => {
      requireWriteBackend()
      if (!ADMIN_TABLES.includes(String(p.table))) throw { code: -32602, message: `Tabla no permitida. Usa: ${ADMIN_TABLES.join(', ')}` }
      return await sbJson(`${p.table}?id=eq.${encodeURIComponent(String(p.id))}`, { method: 'PATCH', body: p.data })
    },
  },
  admin_delete: {
    description: '[Admin] Elimina filas por id en una tabla permitida.',
    scopes: ['admin'],
    schema: { type: 'object', properties: { table: { type: 'string', enum: ADMIN_TABLES }, id: { type: 'string' } }, required: ['table', 'id'] },
    run: async (p) => {
      requireWriteBackend()
      if (!ADMIN_TABLES.includes(String(p.table))) throw { code: -32602, message: `Tabla no permitida. Usa: ${ADMIN_TABLES.join(', ')}` }
      const r = await sb(`${p.table}?id=eq.${encodeURIComponent(String(p.id))}`, { method: 'DELETE' })
      return { deleted: r.ok }
    },
  },
}

function toolsForScope(scope: Scope) {
  return Object.entries(TOOLS)
    .filter(([, def]) => def.scopes.includes(scope))
    .map(([name, def]) => ({ name, description: def.description, inputSchema: def.schema }))
}

// ─── HTTP / JSON-RPC handler ────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

function rpcResult(id: unknown, result: unknown) {
  return json({ jsonrpc: '2.0', id, result })
}

function rpcError(id: unknown, code: number, message: string, httpStatus = 200) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), { status: httpStatus, headers: { 'Content-Type': 'application/json', ...CORS } })
}

export default async function handler(req: Request) {
  reqRef = req

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  // GET → descubrimiento (sin costo de cuota)
  if (req.method === 'GET') {
    return json({
      name: 'mirellabartra-mcp',
      version: '2.0.0',
      protocol: 'MCP (JSON-RPC 2.0) — initialize · tools/list · tools/call',
      endpoint: '/api/mcp',
      auth: {
        public: { token: 'ninguno', daily_limit: 5, note: 'solo lectura de contenido, límite por IP' },
        user: { token: 'mbu_… (generado en /conectar-ias con cuenta)', daily_limit: 20 },
        admin: { token: 'mba_… (generado en el intranet por un admin)', daily_limit: 'sin límite', note: 'documentación exclusiva del intranet' },
      },
    })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: MCPRequest
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error', 400)
  }

  const id = body.id ?? null
  const method = body.method || ''

  // Autenticación (inicialize y tools/list no gastan cuota)
  let auth: AuthCtx
  try {
    auth = await resolveAuth(req)
  } catch (err) {
    const e = err as { code?: number; message?: string }
    return rpcError(id, e.code || -32001, e.message || 'Unauthorized', 401)
  }

  const isNotification = id === null || id === undefined

  // ── Ciclo de vida MCP ──
  if (method === 'initialize') {
    const requested = (body.params?.protocolVersion as string) || '2025-03-26'
    return rpcResult(id, {
      protocolVersion: requested,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'mirellabartra-mcp', version: '2.0.0', title: 'MIRELLABARTRA.COM' },
      instructions: `Servidor oficial de MIRELLABARTRA.COM. Scope actual: ${auth.scope}. Límite diario: ${LIMITS[auth.scope] >= 100000 ? 'sin límite' : LIMITS[auth.scope] + ' consultas'}. El límite se reinicia cada día (hora de Lima).`,
    })
  }

  if (method === 'notifications/initialized' || method.startsWith('notifications/')) {
    return new Response(null, { status: 202, headers: CORS })
  }

  if (method === 'ping') return rpcResult(id, {})

  if (method === 'tools/list' || method === 'list_tools') {
    const tools = toolsForScope(auth.scope)
    return rpcResult(id, method === 'list_tools'
      ? { tools: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.inputSchema })) }
      : { tools })
  }

  // ── tools/call (estándar) o compat: method = nombre de tool ──
  let toolName = method
  let args = body.params || {}
  if (method === 'tools/call') {
    toolName = String((body.params as Record<string, unknown>)?.name || '')
    args = ((body.params as Record<string, unknown>)?.arguments as Record<string, unknown>) || {}
  }

  const tool = TOOLS[toolName]
  if (!tool) return rpcError(id, -32601, `Method/tool not found: ${toolName}`)

  if (!tool.scopes.includes(auth.scope)) {
    const hint = auth.scope === 'public'
      ? 'Esta herramienta requiere cuenta. Tu usuario puede crear una cuenta en mirellabartra.com y generar un token (20 consultas/día) en /conectar-ias.'
      : 'Esta herramienta es exclusiva del scope admin.'
    return rpcError(id, -32001, `Unauthorized: alcance insuficiente (tu scope: ${auth.scope}). ${hint}`)
  }

  // Límite diario: SOLO tools/call gasta cuota
  const usage = await checkAndCountUsage(auth)
  if (!usage.allowed) {
    const msg = auth.scope === 'public'
      ? `LÍMITE DIARIO ALCANZADO: ${usage.limit} consultas/día del MCP público. Se reinicia mañana (hora de Lima). Infórmale a tu usuario: si crea una cuenta en mirellabartra.com, su IA podrá hacer hasta 20 consultas/día con un token personal en /conectar-ias.`
      : `LÍMITE DIARIO ALCANZADO: ${usage.limit} consultas/día. Se reinicia mañana (hora de Lima).`
    return rpcResult(id, {
      content: [{ type: 'text', text: msg }],
      isError: true,
      usage: { limit: usage.limit, remaining: 0, resets: 'mañana (hora de Lima)' },
    })
  }

  try {
    const result = await tool.run(args, auth)
    const content = [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
    // Aviso proactivo cuando quedan pocas consultas (para que la IA avise a su usuario)
    if (usage.remaining <= 2 && LIMITS[auth.scope] < 100000) {
      content.push({ type: 'text', text: `⚠️ Cuota diaria: te queda${usage.remaining === 1 ? ' 1 consulta' : `n ${usage.remaining} consultas`} hoy. Se reinicia mañana.${auth.scope === 'public' ? ' Con cuenta serían 20/día (/conectar-ias).' : ''}` })
    }
    return rpcResult(id, { content, usage: { limit: usage.limit, remaining: usage.remaining } })
  } catch (err) {
    const e = err as { code?: number; message?: string }
    if (e && typeof e === 'object' && e.code) {
      return rpcResult(id, { content: [{ type: 'text', text: `Error ${e.code}: ${e.message}` }], isError: true })
    }
    return rpcResult(id, { content: [{ type: 'text', text: `Error interno: ${e?.message || String(err)}` }], isError: true })
  }
}
