import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate, isDateInFuture } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const CONGRESOS_CATEGORIES = [
  { key: 'todos', label: 'Todos' },
  { key: 'curso-online', label: 'Cursos Online' },
  { key: 'curso-vivo', label: 'Cursos en Vivo' },
  { key: 'b2b', label: 'Capacitaciones B2B' },
  { key: 'workshop', label: 'Workshops Prácticos' },
  { key: 'congreso', label: 'Congresos' },
  { key: 'full-day', label: 'Full-Days' },
]

export default function Congresos() {
  const [courses, setCourses] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todos')

  useEffect(() => {
    Promise.all([
      db.getCourses(),
      db.getEvents(),
    ]).then(([coursesRes, eventsRes]) => {
      setCourses(coursesRes.data || [])
      setEvents(eventsRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Congresos, Cursos y Eventos de Fonoaudiología',
    description: 'Cursos online, cursos en vivo, capacitaciones B2B, workshops, congresos y full-days de terapia de lenguaje.',
    type: 'website',
  })

  // Normalize and tag each item
  const allItems = [
    ...courses.map((c) => ({
      ...c,
      _type: 'curso',
      _route: `/cursos/${c.slug}`,
      _category: categorizeCourse(c),
      _isUpcoming: c.status === 'published' && (c.modality === 'virtual' || isDateInFuture(c.start_date)),
    })),
    ...events.map((e) => ({
      ...e,
      _type: 'evento',
      _route: `/eventos/${e.slug}`,
      _category: categorizeEvent(e),
      _isUpcoming: isDateInFuture(e.start_date) || e.event_status === 'ongoing',
    })),
  ]

  function categorizeCourse(c) {
    const title = (c.title || '').toLowerCase()
    const modality = (c.modality || '').toLowerCase()
    if (title.includes('workshop') || title.includes('taller')) return 'workshop'
    if (title.includes('full') || title.includes('intensivo')) return 'full-day'
    if (modality === 'virtual' || modality === 'online') return 'curso-online'
    if (modality === 'presencial') return 'curso-vivo'
    return 'curso-online'
  }

  function categorizeEvent(e) {
    const title = (e.title || '').toLowerCase()
    if (title.includes('congreso')) return 'congreso'
    if (title.includes('workshop') || title.includes('taller')) return 'workshop'
    if (title.includes('full') || title.includes('intensivo')) return 'full-day'
    return 'congreso'
  }

  const upcoming = allItems.filter((i) => i._isUpcoming)
  const past = allItems.filter((i) => !i._isUpcoming)

  const filteredUpcoming = activeTab === 'todos' ? upcoming : upcoming.filter((i) => i._category === activeTab)
  const filteredPast = activeTab === 'todos' ? past : past.filter((i) => i._category === activeTab)

  return (
    <>
      <Helmet {...meta} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner size={36} />
        </div>
      ) : (
        <>
          <h1 className="font-display" style={{ fontSize: 'clamp(28px, 7vw, 56px)', marginBottom: '8px' }}>
            CONGRESOS
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
            Cursos online, en vivo, capacitaciones corporativas, workshops, congresos y full-days.
            Toda la formación continua en un solo lugar.
          </p>

          {/* B2B Banner */}
          <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>¿Eres una institución?</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Programas corporativos para clínicas y universidades.</div>
            </div>
            <Link to="/capacitaciones-b2b" className="btn-primary btn-small">Capacitaciones B2B</Link>
          </div>

          {/* Category Tabs */}
          <div className="congresos-tabs">
            {CONGRESOS_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`congresos-tab ${activeTab === cat.key ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredUpcoming.length === 0 && filteredPast.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '40px 0' }}>
              No hay actividades en esta categoría por ahora.
            </p>
          ) : (
            <>
              {filteredUpcoming.length > 0 && (
                <section>
                  <h2 className="section-separator">Próximos</h2>
                  <div className="grid-auto-fill">
                    {filteredUpcoming.map((item) => (
                      <Link key={`${item._type}-${item.id}`} to={item._route} style={{ textDecoration: 'none' }}>
                        <div className="card-brutalist" style={{ height: '100%' }}>
                          {item.featured_image && (
                            <img src={item.featured_image} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                          )}
                          <div style={{ padding: '16px' }}>
                            <span className="tag">{getCategoryLabel(item._category)}</span>
                            <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)', lineHeight: 1.3 }}>
                              {item.title}
                            </h3>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              📅 {formatDate(item.start_date)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.modality === 'virtual' ? '💻 Virtual' : item.location_url ? '💻 Virtual' : `📍 ${item.location || 'Por confirmar'}`}
                            </div>
                            {item.price > 0 ? (
                              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>S/ {item.price.toFixed(2)}</div>
                            ) : (
                              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', color: 'var(--accent-glow)' }}>Gratuito</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {filteredPast.length > 0 && (
                <section style={{ marginTop: '40px' }}>
                  <h2 className="section-separator" style={{ opacity: 0.6 }}>Finalizados</h2>
                  <div className="grid-auto-fill">
                    {filteredPast.map((item) => (
                      <Link key={`${item._type}-${item.id}`} to={item._route} style={{ textDecoration: 'none' }}>
                        <div className="card-brutalist" style={{ height: '100%', opacity: 0.7 }}>
                          <div style={{ padding: '16px' }}>
                            <span className="tag tag-outline">{getCategoryLabel(item._category)}</span>
                            <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-dark)' }}>
                              {item.title}
                            </h3>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {formatDate(item.start_date)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

function getCategoryLabel(key) {
  const found = CONGRESOS_CATEGORIES.find((c) => c.key === key)
  return found ? found.label : key
}
