import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Directorio() {
  const [entries, setEntries] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      db.getDirectory(),
      db.getCategories(),
    ]).then(([dirRes, catRes]) => {
      setEntries(dirRes.data || [])
      setSpecialties(catRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = selectedSpecialty
    ? entries.filter(e => e.specialty === selectedSpecialty)
    : entries

  const meta = generateMetaTags({
    title: 'Directorio de Terapeutas de Lenguaje',
    description: 'Encuentra terapeutas de lenguaje certificados. El directorio más grande del continente.',
    type: 'website',
  })

  return (
    <>
      <Helmet {...meta} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>
                Directorio
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px' }}>
                Encuentra terapeutas de lenguaje por especialidad y ubicación.
              </p>
            </div>
            <Link to="/directorio/inscribirse" className="btn-accent">Inscribirme gratis</Link>
          </div>

          {specialties.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                className={`tag ${!selectedSpecialty ? '' : 'tag-outline'}`}
                onClick={() => setSelectedSpecialty('')}
                style={{ cursor: 'pointer' }}
              >
                Todas
              </button>
              {specialties.map(s => (
                <button
                  key={s.id || s.name}
                  className={`tag ${selectedSpecialty === s.name ? '' : 'tag-outline'}`}
                  onClick={() => setSelectedSpecialty(s.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No se encontraron terapeutas en esta categoría.</p>
          ) : (
            <div className="grid-auto-fill">
              {filtered.map(entry => (
                <Link key={entry.id} to={`/directorio/${entry.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card-brutalist" style={{ height: '100%' }}>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%', background: 'var(--text-dark)',
                          color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-display)', flexShrink: 0,
                        }}>
                          {entry.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                            {entry.full_name}
                          </h3>
                          <span className="tag tag-outline" style={{ fontSize: '9px' }}>{entry.specialty || 'Fonoaudiología'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {entry.city && <div>📍 {entry.city}</div>}
                        {entry.years_experience && <div>📋 {entry.years_experience} años de experiencia</div>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
