import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { auth, db, users } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

// Genera un token aleatorio con prefijo por scope (mbu_ = user)
function generateToken(scope) {
  const prefix = scope === 'admin' ? 'mba_' : 'mbu_'
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return prefix + hex
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

const PUBLIC_TOOLS = [
  ['get_articles', 'Lista artículos publicados (noticias y papers)'],
  ['get_article', 'Artículo completo por slug'],
  ['get_courses / get_course', 'Cursos publicados'],
  ['get_events / get_event', 'Eventos y congresos'],
  ['get_directory / get_therapist', 'Directorio de terapeutas'],
  ['search', 'Búsqueda global'],
  ['get_faqs', 'FAQs públicas'],
  ['get_testimonials', 'Testimonios'],
  ['get_specialties', 'Especialidades'],
  ['get_ticker', 'Frases de la barra superior'],
]

const USER_TOOLS = [
  ['whoami', 'Quién eres, scope y consultas restantes'],
  ['get_my_profile / update_my_profile', 'Tu perfil de cuenta'],
  ['get_my_directory_entry', 'Tu entrada del directorio'],
  ['update_my_directory_entry', 'Actualiza tu entrada (bio, ciudad, teléfono, especialidad, foto)'],
  ['get_my_subscriptions', 'Tus suscripciones'],
  ['get_my_metrics', 'Métricas de tu perfil'],
]

export default function ConectarIAs() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [justCreated, setJustCreated] = useState(null)

  useEffect(() => {
    auth.getSession().then(async ({ session: s }) => {
      setSession(s)
      if (s) {
        const { data: p } = await users.getMyProfile()
        setProfile(p)
        const { data: t } = await db.listMyMcpTokens()
        setTokens((t || []).filter((tok) => tok.scope === 'user'))
      }
      setLoading(false)
    })
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!profile) return
    setCreating(true)
    const token = generateToken('user')
    const { data, error } = await db.createMcpToken({
      token,
      name: newName.trim() || 'Mi IA',
      scope: 'user',
      profile_id: profile.id,
    })
    setCreating(false)
    if (error) return alert('No se pudo crear el token: ' + (error.message || 'inténtalo de nuevo'))
    setJustCreated(token)
    setNewName('')
    const { data: t } = await db.listMyMcpTokens()
    setTokens((t || []).filter((tok) => tok.scope === 'user'))
  }

  const handleRevoke = async (tok) => {
    if (!confirm(`¿Revocar el token "${tok.name}"? La IA que lo usa dejará de tener acceso.`)) return
    await db.deleteMcpToken(tok.id)
    const { data: t } = await db.listMyMcpTokens()
    setTokens((t || []).filter((x) => x.scope === 'user'))
  }

  const meta = generateMetaTags({
    title: 'Conecta tus IAs — MCP',
    description: 'Conecta tus asistentes de IA con MIRELLABARTRA.COM vía MCP: noticias, papers, cursos, congresos y directorio de terapeutas.',
  })

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mirellabartra.com'
  const mcpUrl = `${siteUrl}/api/mcp`

  return (
    <>
      <Helmet {...meta} />

      {/* ── Hero ── */}
      <div className="press-masthead">
        <h1>CONECTA TUS IAs</h1>
        <div className="press-subtitle">Model Context Protocol · Consulta nuestro contenido desde cualquier IA</div>
      </div>

      <div style={{ maxWidth: '760px' }}>
        <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: '30px' }}>
          MCP (<strong>Model Context Protocol</strong>) es el estándar abierto para que asistentes de IA como
          Claude, Cursor, ChatGPT u otros lean y usen herramientas externas. Nuestro servidor MCP expone el
          contenido de MIRELLABARTRA.COM — noticias, papers académicos, cursos, congresos y el directorio de
          terapeutas — para que tu IA pueda consultarlo y resumírtelo directamente.
        </p>

        {/* ── Niveles de acceso ── */}
        <h2 className="section-separator" style={{ marginTop: '40px' }}>Niveles de acceso</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '20px' }}>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <span className="tag">Público</span>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', margin: '10px 0 4px' }}>5/día</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Sin cuenta ni token. Tu IA lee el contenido y cuando llega al límite te avisa que se reinicia mañana.
            </div>
          </div>
          <div className="card-brutalist" style={{ padding: '16px', border: '2px solid var(--text-dark)' }}>
            <span className="tag">Con cuenta</span>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', margin: '10px 0 4px' }}>20/día</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Genera tu token personal aquí abajo. Además tu IA puede actualizar tu ficha del directorio y tus datos.
            </div>
          </div>
        </div>

        {/* ── MCP Público ── */}
        <h2 className="section-separator" style={{ marginTop: '50px' }}>1 · MCP Público (sin cuenta)</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, marginTop: '16px' }}>
          No necesitas nada: apunta tu IA al endpoint. Sin encabezados de autorización. Límite de{' '}
          <strong>5 consultas por día</strong>; al llegar al límite, la IA recibirá un mensaje indicándole que se
          reinicia mañana y que creándote una cuenta el límite sube a 20/día.
        </p>
        <CodeBlock code={`claude mcp add --transport http mirellabartra ${mcpUrl}`} />

        <div style={{ margin: '18px 0' }}>
          <div className="font-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>Herramientas disponibles</div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {PUBLIC_TOOLS.map(([name, desc]) => (
              <div key={name} style={{ display: 'flex', gap: '10px', fontSize: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: '3px' }}>{name}</code>
                <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MCP Usuario ── */}
        <h2 className="section-separator" style={{ marginTop: '50px' }}>2 · MCP de Usuario (con cuenta · 20/día)</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, marginTop: '16px' }}>
          Con una cuenta puedes generar un <strong>token personal</strong> (empieza con <code>mbu_</code>). Tu IA
          lo envía como <code>Authorization: Bearer …</code>, sube a <strong>20 consultas/día</strong> y además
          puede <strong>recopilar tu información y actualizar la tuya</strong>: tu perfil y tu ficha del directorio
          de terapeutas. Nunca puede hacer nada de administración.
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : !session ? (
          <div className="card-brutalist" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px' }}>
              Inicia sesión para generar tu token de usuario.
            </p>
            <Link to="/login" className="btn-primary btn-small">Ingresar</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {justCreated && (
              <div className="card-brutalist" style={{ padding: '16px', border: '2px solid var(--text-dark)' }}>
                <div className="font-mono" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  Token creado — cópialo ahora (no se vuelve a mostrar cerrada la sesión)
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all', background: 'var(--accent-glow)', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                  {justCreated}
                </div>
                <button className="btn-primary btn-small" onClick={() => { navigator.clipboard.writeText(justCreated); setJustCreated(null) }}>
                  Copiar y cerrar
                </button>
              </div>
            )}

            <form onSubmit={handleCreate} className="card-brutalist" style={{ padding: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                className="input-brutalist"
                style={{ flex: 1, minWidth: '200px' }}
                placeholder="Nombre para identificar la IA (ej: 'Claude de mi laptop')"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
              />
              <button type="submit" className="btn-accent btn-small" disabled={creating}>
                {creating ? 'Generando…' : '+ Generar token'}
              </button>
            </form>

            {tokens.length > 0 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {tokens.map((tok) => (
                  <div key={tok.id} className="card-brutalist" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', opacity: tok.is_active ? 1 : 0.55 }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{tok.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {tok.is_active ? 'ACTIVO' : 'REVOCADO'}
                        {tok.last_used_at && ` · último uso ${new Date(tok.last_used_at).toLocaleDateString('es-PE')}`}
                        {` · creado ${new Date(tok.created_at).toLocaleDateString('es-PE')}`}
                      </div>
                    </div>
                    <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleRevoke(tok)}>
                      Revocar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="font-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '18px 0 8px' }}>Herramientas adicionales del scope usuario</div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {USER_TOOLS.map(([name, desc]) => (
                  <div key={name} style={{ display: 'flex', gap: '10px', fontSize: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: '3px' }}>{name}</code>
                    <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Configuración por cliente ── */}
        <h2 className="section-separator" style={{ marginTop: '50px' }}>Configuración en tu cliente de IA</h2>

        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '24px 0 10px' }}>Claude Code (terminal)</h3>
        <CodeBlock code={`# Público (sin token)
claude mcp add --transport http mirellabartra ${mcpUrl}

# Con tu token de usuario (20/día)
claude mcp add --transport http mirellabartra ${mcpUrl} --header "Authorization: Bearer mbu_TU_TOKEN"`} />

        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '24px 0 10px' }}>Cursor (~/.cursor/mcp.json)</h3>
        <CodeBlock code={`{
  "mcpServers": {
    "mirellabartra": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer mbu_TU_TOKEN"
      }
    }
  }
}`} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-6px 0 0' }}>
          Para el acceso público simplemente elimina la línea "headers".
        </p>

        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '24px 0 10px' }}>Claude Desktop / Connectors</h3>
        <CodeBlock code={`{
  "mcpServers": {
    "mirellabartra": {
      "url": "${mcpUrl}",
      "headers": { "Authorization": "Bearer mbu_TU_TOKEN" }
    }
  }
}`} />

        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '24px 0 10px' }}>Prueba rápida (curl)</h3>
        <CodeBlock code={`# 1) Saludar al servidor
curl -s ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mbu_TU_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}'

# 2) Ver herramientas
curl -s ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mbu_TU_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3) Llamar una herramienta
curl -s ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mbu_TU_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_articles","arguments":{"limit":3}}}'`} />

        {/* ── Límites ── */}
        <h2 className="section-separator" style={{ marginTop: '50px' }}>Cómo funcionan los límites</h2>
        <ul style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 2, paddingLeft: '20px' }}>
          <li>Cada <strong>consulta de herramienta</strong> (tools/call) cuenta 1. Ver herramientas y conectarse no gasta cuota.</li>
          <li>La cuota se reinicia <strong>cada día</strong> (hora de Lima).</li>
          <li>Cuando quedan ≤2 consultas, tu IA recibirá un aviso para informarte antes de agotarlas.</li>
          <li>Al llegar al límite, la IA recibe el mensaje exacto: <em>"límite alcanzado, se reinicia mañana"</em> — y en el público, la sugerencia de crear cuenta para pasar a 20/día.</li>
        </ul>

        <div className="card-brutalist" style={{ padding: '16px', margin: '30px 0 10px', background: 'var(--accent-glow)' }}>
          <div style={{ fontSize: '12px', lineHeight: 1.7 }}>
            <strong>¿Eres administradora del sitio?</strong> La documentación del MCP de administración
            (tokens admin, gestión completa de contenido) está exclusivamente dentro del intranet, en la
            sección <strong>Solo Admin → MCP · IAs</strong>.
          </div>
        </div>
      </div>
    </>
  )
}
