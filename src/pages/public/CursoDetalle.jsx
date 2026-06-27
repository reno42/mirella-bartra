import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateCourseLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate, isDateInPast } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function CursoDetalle() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const { getToken } = useRecaptcha()

  useEffect(() => {
    db.getCourseBySlug(slug).then(({ data }) => {
      setCourse(data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [slug])

  const handleEnroll = async (e) => {
    e.preventDefault()
    setEnrolling(true)
    const token = await getToken('enroll')
    const formData = new FormData(e.target)
    const enrollment = {
      course_id: course.id,
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      recaptcha_token: token,
    }
    const { error } = await db.enrollInCourse(enrollment)
    setEnrolling(false)
    if (error) {
      alert('Error al inscribirte. Intenta de nuevo.')
    } else {
      setEnrolled(true)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
  if (!course) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <h2 className="font-display" style={{ fontSize: '24px' }}>Curso no encontrado</h2>
      <Link to="/cursos" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Ver todos los cursos</Link>
    </div>
  )

  const meta = generateMetaTags({
    title: course.title,
    description: course.description || '',
    image: course.featured_image,
    url: `cursos/${course.slug}`,
    type: 'article',
  })

  const courseLD = generateCourseLD(course)
  const breadcrumbLD = generateBreadcrumbLD([
    { name: 'Inicio', url: '/' },
    { name: 'Cursos', url: '/cursos' },
    { name: course.title },
  ])

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">{JSON.stringify([courseLD, breadcrumbLD])}</script>
      </Helmet>

      <Link to="/cursos" className="back-link">← Volver a cursos</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', maxWidth: '1100px', margin: '0 auto', alignItems: 'start' }}>
        <article>
          <header style={{ marginBottom: '24px' }}>
            <span className="tag tag-outline">{course.modality === 'virtual' ? 'VIRTUAL' : course.modality === 'presencial' ? 'PRESENCIAL' : 'HÍBRIDO'}</span>
            <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.15, margin: '12px 0' }}>
              {course.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {course.description}
            </p>
          </header>

          {course.featured_image && (
            <img src={course.featured_image} alt="" style={{ width: '100%', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }} />
          )}

          <div className="article-content" dangerouslySetInnerHTML={{ __html: course.content || '' }} />
        </article>

        <aside style={{ position: 'sticky', top: '80px' }}>
          <div className="card-brutalist" style={{ padding: '20px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              {course.price > 0 ? `S/ ${course.price.toFixed(2)}` : 'GRATUITO'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>📅 {formatDate(course.start_date)}{course.end_date ? ` → ${formatDate(course.end_date)}` : ''}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>⏱ {course.duration || 'A definir'}</div>
            {course.certificate && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>🎓 Incluye certificado</div>}

            {enrolled ? (
              <div style={{ padding: '12px', background: '#d4edda', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                ✅ ¡Inscripción exitosa! Te contactaremos pronto.
              </div>
            ) : (
              <form onSubmit={handleEnroll}>
                <input name="full_name" className="input-brutalist" placeholder="Nombre completo" required style={{ marginBottom: '8px' }} />
                <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico" required style={{ marginBottom: '8px' }} />
                <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono (opcional)" style={{ marginBottom: '12px' }} />
                {course.price > 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                    Realiza el depósito a la cuenta indicada, sube tu comprobante y completa el formulario. Nos pondremos en contacto para confirmar tu inscripción.
                  </p>
                )}
                <button type="submit" className="btn-accent btn-small" style={{ width: '100%' }} disabled={enrolling}>
                  {enrolling ? 'Procesando...' : 'Inscribirme'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .article-content + div { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
