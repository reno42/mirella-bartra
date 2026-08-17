import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db, users } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

function generateAdminToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return 'mba_' + hex
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <button
        onClick={copy}
        className="btn-outline btn-small"
        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1, background: copied ? 'var(--accent-glow)' : 'white' }}
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
      <pre style={{ background: 'var(--text-dark)', color: 'var(--text-light)', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '11px', lineHeight: 1.7, fontFamily: 'var(--font-mono)', margin: 0 }}>
        {code}
      </pre>
    </div>
  )
}

const ADMIN_TOOLS = [
  ['get_metrics', 'Métricas del dashboard'],
  ['get_all_articles / courses / events / directory', 'Todo el contenido, incl. borradores'],
  ['create_article / update_article / delete_article', 'CRUD de artículos'],
  ['admin_list { table, filters, limit, order }', 'Lista cualquier tabla permitida'],
  ['admin_insert { table, data }', 'Inserta en cualquier tabla permitida'],
  ['admin_update { table, id, data }', 'Actualiza por id'],
  ['admin_delete { table, id }', 'Elimina por id'],
  ['get_leads / get_subscribers / get_deposits / get_bidding', 'CRM: leads, suscriptores, depósitos, pujas'],
  ['get_config', 'Configuración del sitio (cms_config)'],
  ['Herramientas públicas y de usuario', 'Todo lo anterior también está disponible'],
]

const ADMIN_TABLES = 'articles · events · courses · directory · ticker_messages · faqs · testimonials · subscribers · leads · deposits · complaints_book · cms_config · event_registrations · certificates · b2b_programs'

export default function McpAdmin() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [justCreated, setJustCreated] = useState(null)

  useEffect(() => {
    users.getMyProfile().then(async ({ data }) => {
      setProfile(data)
      if (data?.role === 'admin') {
        const { data: t } = await db.listMyMcpTokens()
        setTokens((t || []).filter((tok) => tok.scope === 'admin'))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  // Documentación exclusiva de admins: nadie más puede verla
  if (profile?.role !== 'admin') {
    return (
      <>
        <Helmet><title>MCP | Admin</title></Helmet>
        <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '16px' }}>MCP · IAs</h1>
        <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center', border: '2px solid #ef4444' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Acceso exclusivo para administradores</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            La documentación y gestión del MCP de administración solo está disponible para cuentas con rol admin.
          </div>
        </div>
      </>
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    const token = generateAdminToken()
    const { error } = await db.createMcpToken({
      token,
      name: newName.trim() || 'IA de administración',
      scope: 'admin',
      profile_id: profile.id,
    })
    setCreating(false)
    if (error) return alert('No se pudo crear el token admin: ' + (error.message || ''))
    setJustCreated(token)
    setNewName('')
    const { data: t } = await db.listMyMcpTokens()
    setTokens((t || []).filter((tok) => tok.scope === 'admin'))
  }

  const handleDelete = async (tok) => {
    if (!confirm(`¿Eliminar el token admin "${tok.name}"? La IA que lo usa perderá TODO el acceso de administración.`)) return
    await db.deleteMcpToken(tok.id)
    const { data: t } = await db.listMyMcpTokens()
    setTokens((t || []).filter((x) => x.scope === 'admin'))
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mirellabartra.com'
  const mcpUrl = `${siteUrl}/api/mcp`

  return (
    <>
      <Helmet><title>MCP · IAs | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '6px' }}>MCP · IAs de Administración</h1>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '640px', lineHeight: 1.6 }}>
        Genera tokens <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-glow)', padding: '1px 5px', borderRadius: '3px' }}>mba_…</code> para
        conectar tus IAs (Claude, Cursor, etc.) con <strong>todos los poderes de admin</strong>: crear y editar contenido, gestionar
        el directorio, ver leads y suscriptores, el ticker, etc. <strong>Sin límite diario.</strong>
      </p>

      <div className="card-brutalist" style={{ padding: '14px 16px', marginBottom: '24px', maxWidth: '700px', borderLeft: '4px solid #ef4444' }}>
        <div style={{ fontSize: '12px', lineHeight: 1.7 }}>
          ⚠️ <strong>Un token admin es una llave maestra.</strong> Trátalo como una contraseña: no lo compartas ni lo
          pegues donde otras personas puedan verlo. Puedes eliminarlo aquí en cualquier momento y queda revocado al instante.
        </div>
      </div>

      {/* Gestor de tokens */}
      <h2 className="section-separator">Mis tokens de administración</h2>

      {justCreated && (
        <div className="card-brutalist" style={{ padding: '16px', margin: '16px 0', border: '2px solid var(--text-dark)', maxWidth: '700px' }}>
          <div className="font-mono" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)' }}>
            Token admin creado — cópialo ahora
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all', background: 'var(--accent-glow)', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
            {justCreated}
          </div>
          <button className="btn-primary btn-small" onClick={() => { navigator.clipboard.writeText(justCreated); setJustCreated(null) }}>
            Copiar y cerrar
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="card-brutalist" style={{ padding: '16px', margin: '16px 0', display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '700px' }}>
        <input
          className="input-brutalist"
          style={{ flex: 1, minWidth: '220px' }}
          placeholder="Nombre (ej: 'Claide del estudio')"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={60}
        />
        <button type="submit" className="btn-primary btn-small" disabled={creating}>
          {creating ? 'Generando…' : '+ Generar token admin'}
        </button>
      </form>

      {tokens.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No tienes tokens admin activos.</p>
      ) : (
        <div style={{ display: 'grid', gap: '8px', maxWidth: '700px', marginBottom: '40px' }}>
          {tokens.map((tok) => (
            <div key={tok.id} className="card-brutalist" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', opacity: tok.is_active ? 1 : 0.55 }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{tok.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  {tok.is_active ? 'ACTIVO' : 'INACTIVO'}
                  {tok.last_used_at && ` · último uso ${new Date(tok.last_used_at).toLocaleString('es-PE')}`}
                  {` · creado ${new Date(tok.created_at).toLocaleDateString('es-PE')}`}
                </div>
              </div>
              <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(tok)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Documentación exclusiva admin */}
      <h2 className="section-separator">Documentación (exclusiva de este panel)</h2>

      <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '22px 0 10px' }}>Conectar tu IA con poderes de admin</h3>
      <CodeBlock code={`claude mcp add --transport http mirellabartra-admin ${mcpUrl} \\
  --header "Authorization: Bearer mba_TU_TOKEN"`} />

      <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '22px 0 10px' }}>Cursor (~/.cursor/mcp.json)</h3>
      <CodeBlock code={`{
  "mcpServers": {
    "mirellabartra-admin": {
      "url": "${mcpUrl}",
      "headers": { "Authorization": "Bearer mba_TU_TOKEN" }
    }
  }
}`} />

      <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '22px 0 10px' }}>Herramientas del scope admin</h3>
      <div style={{ display: 'grid', gap: '6px', marginBottom: '20px' }}>
        {ADMIN_TOOLS.map(([name, desc]) => (
          <div key={name} style={{ display: 'flex', gap: '10px', fontSize: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: '3px' }}>{name}</code>
            <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
          </div>
        ))}
      </div>

      <div className="card-brutalist" style={{ padding: '16px', maxWidth: '700px' }}>
        <div className="font-mono" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-muted)' }}>Tablas permitidas en admin_list / insert / update / delete</div>
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>{ADMIN_TABLES}</div>
      </div>

      <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '26px 0 10px' }}>Ejemplo: publicar un artículo desde tu IA</h3>
      <CodeBlock code={`curl -s ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mba_TU_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_article","arguments":{"title":"Nuevo hallazgo en terapia de lenguaje","articleSection":"Noticias","content":"<p>Contenido…</p>","status":"published","slug":"nuevo-hallazgo"}}}'`} />

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '640px', lineHeight: 1.7 }}>
        Los tokens se validan contra la tabla <code>mcp_tokens</code> en cada llamada; eliminar uno aqui lo revoca
        inmediatamente. Las operaciones de escritura usan el service role desde la edge function (nunca expones claves
        a la IA). Los scopes usuario y público no pueden alcanzar ninguna herramienta admin: el servidor las filtra
        por scope antes de ejecutar.
      </p>
    </>
  )
}
