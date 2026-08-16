import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate, formatDateTime } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

/**
 * CRM — Unified contact activity timeline.
 *
 * Reads from the SQL views `v_crm_contacts` and `v_crm_timeline` which UNION
 * all lead-capture touchpoints: subscribers, leads (forms), course enrollments,
 * event registrations, and certificates. Every new interaction (subscription,
 * form submission, download, enrollment, certificate) appears with its date.
 */

const TYPE_META = {
  subscription:   { icon: '📬', label: 'Suscripción', color: '#0d9488' },
  lead_form:      { icon: '📝', label: 'Dejó datos (formulario)', color: '#4f46e5' },
  course_enroll:  { icon: '🎓', label: 'Inscripción a curso', color: '#b45309' },
  event_register: { icon: '📅', label: 'Inscripción a evento', color: '#0369a1' },
  certificate:    { icon: '🏅', label: 'Certificado emitido', color: '#be185d' },
}

export default function CRM() {
  const [contacts, setContacts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // selected contact email
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    db.getCRMContacts().then(({ data, error }) => {
      if (error) {
        setError(error.message + ' — asegúrate de ejecutar el script 06_crm_certificados.sql en Supabase.')
        setContacts([])
      } else {
        setContacts(data || [])
        setFiltered(data || [])
      }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setTimelineLoading(true)
    db.getCRMTimeline(selected).then(({ data }) => {
      setTimeline(data || [])
    }).finally(() => setTimelineLoading(false))
  }, [selected])

  // Search + type filter
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(contacts.filter(c =>
      (!q || (c.contact_email || '').toLowerCase().includes(q) || (c.contact_name || '').toLowerCase().includes(q)) &&
      (typeFilter === 'all' || (c.activity_types || '').includes(typeFilter))
    ))
  }, [search, typeFilter, contacts])

  return (
    <>
      <Helmet><title>CRM | Mirella Admin</title></Helmet>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>CRM <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({contacts.length} contactos)</span></h1>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Historial unificado: suscripciones, formularios, inscripciones y certificados — con fecha de cada interacción.
        </p>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <div className="card-brutalist" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>⚠️ No se pudo cargar el CRM</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{error}</p>
        </div>
      ) : (
        <div className="crm-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 5fr) minmax(320px, 7fr)', gap: '16px', alignItems: 'start' }}>

          {/* ── Left: contacts list ── */}
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
              <input
                className="input-brutalist"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="input-brutalist" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">Todos los tipos de actividad</option>
                {Object.entries(TYPE_META).map(([id, m]) => (
                  <option key={id} value={id}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin contactos que coincidan.</p>
            ) : (
              <div style={{ maxHeight: '560px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                {filtered.map(c => (
                  <button
                    key={c.contact_email}
                    onClick={() => setSelected(c.contact_email)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: selected === c.contact_email ? '2px solid var(--text-dark)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: selected === c.contact_email ? 'var(--accent-glow)' : 'white',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{c.contact_name || 'Sin nombre'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.contact_email}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span>⚡ {c.total_activities} interacciones</span>
                      <span>· última: {c.last_activity ? formatDate(c.last_activity) : '-'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: timeline ── */}
          <div className="card-brutalist" style={{ padding: '16px', minHeight: '400px' }}>
            {!selected ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>👈</div>
                <p style={{ fontSize: '13px' }}>Selecciona un contacto para ver su historial completo.</p>
              </div>
            ) : timelineLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                  {(() => { const c = contacts.find(x => x.contact_email === selected); return c?.contact_name || selected })()}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}> · {timeline.length} eventos</span>
                </h3>

                {timeline.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin actividad registrada.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0' }}>
                    {timeline.map((t, i) => {
                      const meta = TYPE_META[t.activity_type] || { icon: '•', label: t.activity_type, color: '#555' }
                      return (
                        <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: i === timeline.length - 1 ? 0 : '16px' }}>
                          {/* Timeline line */}
                          {i < timeline.length - 1 && (
                            <div style={{ position: 'absolute', left: '15px', top: '34px', bottom: '0', width: '2px', background: 'var(--border-color)' }} />
                          )}
                          {/* Icon bubble */}
                          <div style={{
                            width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%',
                            background: 'white', border: `2px solid ${meta.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', zIndex: 1,
                          }}>
                            {meta.icon}
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {formatDateTime(t.activity_date) || formatDate(t.activity_date)}
                              </span>
                            </div>
                            {t.detail && (
                              <div style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.5 }}>{t.detail}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .crm-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
