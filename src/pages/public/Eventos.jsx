import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate, isDateInFuture } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Eventos() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getEvents().then(({ data }) => {
      setEvents(data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const upcoming = events.filter(e => isDateInFuture(e.start_date) || e.event_status === 'ongoing')
  const past = events.filter(e => !isDateInFuture(e.start_date) && e.event_status !== 'ongoing')

  const meta = generateMetaTags({
    title: 'Eventos y Congresos de Fonoaudiología',
    description: 'Congresos, talleres y eventos de terapia de lenguaje. Participa en la comunidad profesional de fonoaudiología.',
    type: 'website',
  })

  return (
    <>
      <Helmet {...meta} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner size={36} />
        </div>
      ) : (
        <>
          <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>
            Eventos
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
            Congresos, talleres y eventos de fonoaudiología.
          </p>

          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay eventos programados aún.</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="section-separator">Próximos eventos</h2>
                  <div className="grid-auto-fill">
                    {upcoming.map(event => (
                      <Link key={event.id} to={`/eventos/${event.slug}`} style={{ textDecoration: 'none' }}>
                        <div className="card-brutalist" style={{ height: '100%' }}>
                          {event.featured_image && (
                            <img src={event.featured_image} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                          )}
                          <div style={{ padding: '16px' }}>
                            <span className="tag">{event.event_status === 'ongoing' ? 'EN VIVO' : 'PRÓXIMO'}</span>
                            <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)' }}>
                              {event.title}
                            </h3>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              📅 {formatDate(event.start_date)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              📍 {event.location_url ? 'Virtual' : event.location || 'Por confirmar'}
                            </div>
                            {event.price > 0 && (
                              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>S/ {event.price.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section style={{ marginTop: '40px' }}>
                  <h2 className="section-separator" style={{ opacity: 0.6 }}>Eventos pasados</h2>
                  <div className="grid-auto-fill">
                    {past.map(event => (
                      <Link key={event.id} to={`/eventos/${event.slug}`} style={{ textDecoration: 'none' }}>
                        <div className="card-brutalist" style={{ height: '100%', opacity: 0.7 }}>
                          <div style={{ padding: '16px' }}>
                            <span className="tag tag-outline">FINALIZADO</span>
                            <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-dark)' }}>
                              {event.title}
                            </h3>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {formatDate(event.start_date)}
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
