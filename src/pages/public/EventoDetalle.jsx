import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateEventLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate, formatDateTime } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

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
      <Link to="/eventos" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Ver todos los eventos</Link>
    </div>
  )

  const meta = generateMetaTags({
    title: event.title,
    description: event.description || '',
    image: event.featured_image,
    url: `eventos/${event.slug}`,
    type: 'event',
  })

  const eventLD = generateEventLD(event)
  const breadcrumbLD = generateBreadcrumbLD([
    { name: 'Inicio', url: '/' },
    { name: 'Eventos', url: '/eventos' },
    { name: event.title },
  ])

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">{JSON.stringify([eventLD, breadcrumbLD])}</script>
      </Helmet>

      <Link to="/eventos" className="back-link">← Volver a eventos</Link>

      <article style={{ maxWidth: '760px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <span className="tag">{event.event_status === 'ongoing' ? 'EN VIVO' : event.event_status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}</span>
          <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', lineHeight: 1.15, margin: '12px 0' }}>
            {event.title}
          </h1>
        </header>

        {event.featured_image && (
          <img src={event.featured_image} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(event.start_date)}</div>
            {event.end_date && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>hasta {formatDate(event.end_date)}</div>}
          </div>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Modalidad</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{event.location_url ? 'Virtual' : 'Presencial'}</div>
          </div>
          {event.price > 0 && (
            <div className="card-brutalist" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Inversión</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>S/ {event.price.toFixed(2)}</div>
            </div>
          )}
        </div>

        {event.location && !event.location_url && (
          <div style={{ marginBottom: '24px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px' }}>
            📍 {event.location}
          </div>
        )}

        <div className="article-content" dangerouslySetInnerHTML={{ __html: event.content || event.description || '' }} />

        {event.location_url && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="btn-accent">
              Acceder al evento
            </a>
          </div>
        )}
      </article>
    </>
  )
}
