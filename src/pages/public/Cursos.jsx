import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate, isDateInFuture } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Cursos() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getCourses().then(({ data }) => {
      setCourses(data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Cursos de Terapia de Lenguaje',
    description: 'Cursos especializados en fonoaudiología, terapia de lenguaje, habla, voz y deglución. Modalidad virtual y presencial.',
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
            Cursos
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
            Formación continua para terapeutas de lenguaje. Certificación profesional.
          </p>

          {/* B2B Link */}
          <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>¿Eres una institución?</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ofrecemos programas corporativos para clínicas y universidades.</div>
            </div>
            <Link to="/capacitaciones-b2b" className="btn-primary btn-small">Capacitaciones B2B</Link>
          </div>

          {courses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay cursos disponibles en este momento.</p>
          ) : (
            <div className="grid-auto-fill">
              {courses.map(course => (
                <Link key={course.id} to={`/cursos/${course.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card-brutalist" style={{ height: '100%' }}>
                    {course.featured_image && (
                      <img src={course.featured_image} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '16px' }}>
                      <span className="tag tag-outline">{course.modality === 'virtual' ? 'VIRTUAL' : course.modality === 'presencial' ? 'PRESENCIAL' : 'HÍBRIDO'}</span>
                      <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)', lineHeight: 1.3 }}>
                        {course.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {course.description || ''}...
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                        📅 Inicia: {formatDate(course.start_date)}
                      </div>
                      {course.price > 0 ? (
                        <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
                          S/ {course.price.toFixed(2)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', color: 'var(--accent-glow)' }}>
                          Gratuito
                        </div>
                      )}
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
