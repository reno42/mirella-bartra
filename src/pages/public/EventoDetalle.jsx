import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateEventLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate, formatDateTime } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import NewsletterCTA from '@/components/NewsletterCTA.jsx'

export default function EventoDetalle() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getEventBySlug(slug).then(({ data }) => setEvent(data))
      .catch(console.error).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
  if (!event) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <h2 className="font-display" style={{ fontSize: '24px' }}>Evento no encontrado</h2>
      <Link to="/congresos" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Ver congresos</Link>
    </div>
  )

  const meta = generateMetaTags({
    title: event.title || event.name,
    description: event.description || '',
    image: event.featured_image,
    url: `congresos/${event.slug}`,
    type: 'event',
  })

  const eventLD = generateEventLD(event)
  const breadcrumbLD = generateBreadcrumbLD([
    { name: 'Inicio', url: '/' },
    { name: 'Congresos', url: '/congresos' },
    { name: event.title || event.name },
  ])

  // Parse speakers from JSON if available
  const speakers = event.speakers_json || event.speakers || []
  const agenda = event.agenda_json || event.agenda || []

  const eventTitle = event.title || event.name || 'Evento'

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">{JSON.stringify([eventLD, breadcrumbLD])}</script>
      </Helmet>

      <Link to="/congresos" className="back-link">← Volver a congresos</Link>

      {/* ── Concert Hero ── */}
      <div className="event-hero">
        {event.featured_image ? (
          <img src={event.featured_image} alt={eventTitle} />
        ) : (
          <div style={{
            width: '100%',
            height: 'clamp(280px, 50vw, 500px)',
            background: 'var(--text-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 8vw, 80px)',
            color: 'var(--accent-glow)',
          }}>
            {eventTitle.charAt(0)}
          </div>
        )}
        <div className="event-hero-overlay">
          <span className="event-hero-badge">
            {event.event_status === 'ongoing' ? 'EN VIVO AHORA' : event.event_status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}
          </span>
          <h1 className="event-hero-title">{eventTitle}</h1>
          <div className="event-hero-meta">
            <span className="event-hero-meta-item">📅 {formatDate(event.start_date)}</span>
            {event.end_date && <span className="event-hero-meta-item">→ {formatDate(event.end_date)}</span>}
            <span className="event-hero-meta-item">
              {event.location_url ? '💻 Virtual' : `📍 ${event.venue || event.location || event.city || ''}`}
            </span>
            {event.price > 0 && (
              <span className="event-hero-meta-item" style={{ fontWeight: 700 }}>S/ {event.price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ── Info Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '30px' }}>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(event.start_date)}</div>
            {event.end_date && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>hasta {formatDate(event.end_date)}</div>}
          </div>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Modalidad</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{event.location_url ? 'Virtual' : 'Presencial'}</div>
          </div>
          {event.city && (
            <div className="card-brutalist" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Sede</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{event.venue || event.city}</div>
            </div>
          )}
          {event.price > 0 && (
            <div className="card-brutalist" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Inversión</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>S/ {event.price.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        {event.description && (
          <section style={{ marginBottom: '30px' }}>
            <h2 className="section-separator">Sobre el evento</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-dark)' }}>
              {event.description}
            </p>
          </section>
        )}

        {/* ── Speakers ── */}
        {speakers.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h2 className="section-separator">Ponentes</h2>
            <div className="speakers-grid">
              {speakers.map((speaker, i) => (
                <div key={i} className="speaker-card">
                  <div className="speaker-avatar">
                    {speaker.full_name ? speaker.full_name.charAt(0) : speaker.name ? speaker.name.charAt(0) : '?'}
                  </div>
                  <div className="speaker-name">{speaker.full_name || speaker.name || 'Ponente'}</div>
                  <div className="speaker-role">{speaker.role || speaker.speaker_role || 'Ponente'}</div>
                  {(speaker.topic || speaker.speaker_topic) && (
                    <div className="speaker-topic">{speaker.topic || speaker.speaker_topic}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Agenda ── */}
        {agenda.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h2 className="section-separator">Agenda / Programa</h2>
            <div className="agenda-timeline">
              {agenda.map((item, i) => (
                <div key={i} className="agenda-item">
                  <div className="agenda-time">{item.time || item.start_time}</div>
                  <div className="agenda-title">{item.title || item.topic}</div>
                  {(item.speaker || item.speaker_name) && (
                    <div className="agenda-speaker">por {item.speaker || item.speaker_name}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Full content if available ── */}
        {event.content && (
          <div className="article-content" dangerouslySetInnerHTML={{ __html: event.content }} />
        )}

        {/* ── Mirella as speaker info ── */}
        {event.is_mirella_speaker && event.speaker_role && (
          <div style={{
            marginTop: '30px', padding: '20px', background: 'var(--accent-glow)', borderRadius: '12px', border: '1px solid var(--text-dark)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Participación</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Mirella Bartra — {event.speaker_role}</div>
            {event.speaker_topic && <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{event.speaker_topic}</div>}
          </div>
        )}

        {/* ── Location ── */}
        {event.location && !event.location_url && (
          <div style={{ marginBottom: '24px', marginTop: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Ubicación</div>
            <div className="modal-map">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-77.15%2C-12.15%2C-76.95%2C-11.95&layer=mapnik&marker=-12.05%2C-77.05`}
                title={`Ubicación: ${event.location}`}
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        {event.event_status !== 'finished' && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            {event.location_url ? (
              <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="btn-accent" style={{ fontSize: '14px', padding: '12px 32px' }}>
                Acceder al evento
              </a>
            ) : (
              <Link to="/depositar" state={{ eventTitle: eventTitle, eventPrice: event.price, eventId: event.id }} className="btn-accent" style={{ fontSize: '14px', padding: '12px 32px' }}>
                {event.price > 0 ? `Inscribirme — S/ ${event.price.toFixed(2)}` : 'Inscribirme gratis'}
              </Link>
            )}
          </div>
        )}
      </div>

      <NewsletterCTA />
    </>
  )
}
