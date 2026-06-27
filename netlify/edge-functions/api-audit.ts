/**
 * Edge Function: api-audit
 * Simple audit logging for admin actions.
 * POST /api/audit — Log an admin action
 * GET /api/audit  — View recent audit logs (admin only)
 */

interface AuditEntry {
  id: string
  timestamp: string
  user_id?: string
  user_email?: string
  action: string
  resource: string
  resource_id?: string
  details?: string
  ip: string
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

function supabaseHeaders(useServiceRole = false) {
  return {
    apikey: useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_KEY,
    Authorization: `Bearer ${useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) return null
    return await resp.json()
  } catch { return null }
}

export default async function handler(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' },
    })
  }

  const user = await getUser(req)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // GET: View audit logs (admin only)
  if (req.method === 'GET') {
    const limit = new URL(req.url).searchParams.get('limit') || '50'
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/audit_logs?order=timestamp.desc&limit=${limit}`,
      { headers: supabaseHeaders(true) }
    )
    const data = await resp.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' },
    })
  }

  // POST: Log an action
  if (req.method === 'POST') {
    const body = await req.json()
    const entry: Partial<AuditEntry> = {
      timestamp: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      action: body.action,
      resource: body.resource,
      resource_id: body.resource_id || null,
      details: body.details || null,
      ip,
    }

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: supabaseHeaders(true),
      body: JSON.stringify(entry),
    })

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to log' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
