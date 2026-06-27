import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generatePersonLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function TerapeutaDetalle() {
  const { slug } = useParams()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getTherapistBySlug(slug).then(({ data }) => setEntry(data))
      .catch(console.error).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
  if (!entry) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <h2 className="font-display" style={{ fontSize: '24px' }}>Terapeuta no encontrado</h2>
      <Link to="/directorio" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Ver directorio</Link>
    </div>
  )

  const meta = generateMetaTags({
    title: `${entry.full_name} — Directorio de Terapeutas`,
    description: `${entry.full_name}, ${entry.specialty || 'Fonoaudiólogo(a)'} en ${entry.city || 'Perú'}. ${entry.years_experience || 0} años de experiencia.`,
    type: 'profile',
  })

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">
          {JSON.stringify(generatePersonLD({
            name: entry.full_name,
            description: entry.bio || entry.description,
            jobTitle: entry.specialty,
            image: entry.profile_image,
            url: `directorio/${entry.slug}`,
          }))}
        </script>
      </Helmet>

      <Link to="/directorio" className="back-link">← Volver al directorio</Link>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--text-dark)',
            color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '28px', fontFamily: 'var(--font-display)', flexShrink: 0,
          }}>
            {entry.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 36px)', lineHeight: 1.2 }}>
              {entry.full_name}
            </h1>
            <span className="tag">{entry.specialty || 'Fonoaudiología'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '30px' }}>
          {entry.city && <div className="card-brutalist" style={{ padding: '12px' }}>📍 {entry.city}</div>}
          {entry.years_experience > 0 && <div className="card-brutalist" style={{ padding: '12px' }}>📋 {entry.years_experience} años de experiencia</div>}
          {entry.email && <div className="card-brutalist" style={{ padding: '12px' }}>✉️ {entry.email}</div>}
          {entry.phone && <div className="card-brutalist" style={{ padding: '12px' }}>📞 {entry.phone}</div>}
        </div>

        {entry.bio && (
          <div className="article-content">
            <h2>Biografía</h2>
            <p>{entry.bio}</p>
          </div>
        )}
      </div>
    </>
  )
}
