import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateOrganizationLD, generateWebSiteLD, generatePersonLD, generateFAQPageLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate, daysUntil, isDateInFuture } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const MAX_FEATURED = 4

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentCourses, setRecentCourses] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      db.getArticles({ featured: true, limit: MAX_FEATURED }),
      db.getArticles({ limit: 6 }),
      db.getEvents({ upcoming: true }),
      db.getCourses(),
      db.getTestimonials(),
      db.getFAQs('page', 'home'),
    ]).then(([featuredRes, latestRes, eventsRes, coursesRes, testimonialsRes, faqsRes]) => {
      setFeaturedArticles(featuredRes.data || [])
      setLatestArticles((latestRes.data || []).filter(a => !a.is_featured).slice(0, 4))
      setUpcomingEvents((eventsRes.data || []).filter(e => isDateInFuture(e.start_date)).slice(0, 3))
      setRecentCourses((coursesRes.data || []).slice(0, 3))
      setTestimonials((testimonialsRes.data || []).slice(0, 5))
      setFaqs(faqsRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Terapia de Lenguaje, Noticias y Cursos',
    description: 'Portal de terapia de lenguaje: noticias, congresos, cursos, directorio profesional, comunidad. Mirella Bartra, fonoaudióloga y docente UNFV.',
    type: 'website',
  })

  const organizationLD = generateOrganizationLD()
  const webSiteLD = generateWebSiteLD()
  const personLD = generatePersonLD()
  const faqLD = generateFAQPageLD(faqs, '')
  const breadcrumbLD = generateBreadcrumbLD([{ name: 'Inicio', url: '/' }])

  const allSchema = [organizationLD, webSiteLD, personLD, breadcrumbLD]
  if (faqLD) allSchema.push(faqLD)

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">{JSON.stringify(allSchema)}</script>
      </Helmet>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner size={36} />
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <section style={{ padding: 'clamp(30px, 6vw, 60px) 0' }}>
            <div style={{ maxWidth: '700px' }}>
              <p className="font-mono" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Fonoaudiología · Investigación · Comunidad
              </p>
              <h1 className="font-display" style={{
                fontSize: 'clamp(28px, 7vw, 56px)',
                lineHeight: 1.05,
                marginBottom: '16px',
                color: 'var(--text-dark)',
              }}>
                MIRELLA<br />BARTRA
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', maxWidth: '540px' }}>
                Primera plataforma de medios para terapeutas de lenguaje. Noticias basadas en evidencia, 
                cursos especializados, congresos y un directorio profesional para conectar.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/articulos" className="btn-primary">Ver noticias</Link>
                <Link to="/directorio" className="btn-outline">Directorio profesional</Link>
              </div>
            </div>
          </section>

          {/* ── Metrics Strip ── */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            padding: '20px 0',
            marginBottom: '40px',
            display: 'flex',
            gap: 'clamp(20px, 5vw, 60px)',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '150+', label: 'Artículos publicados' },
              { value: '20+', label: 'Cursos impartidos' },
              { value: '3,000+', label: 'Terapeutas en directorio' },
              { value: '10,000+', label: 'Suscriptores' },
            ].map(m => (
              <div key={m.label}>
                <div className="font-display" style={{ fontSize: '24px', lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* ── Featured Articles ── */}
          {featuredArticles.length > 0 && (
            <section>
              <h2 className="section-separator">Destacados</h2>
              <div className="grid-auto-fill">
                {featuredArticles.map(article => (
                  <Link key={article.id} to={`/articulos/${article.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card-brutalist" style={{ height: '100%' }}>
                      {article.featured_image && (
                        <img src={article.featured_image} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: '16px' }}>
                        <span className="tag">{article.articleSection || article.category || 'Artículo'}</span>
                        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)', lineHeight: 1.3 }}>
                          {article.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                          {article.description || (article.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}...
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                          {formatDate(article.published_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Latest Articles ── */}
          {latestArticles.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="section-separator" style={{ margin: '45px 0 0 0', borderBottom: 'none', paddingBottom: 0 }}>Últimas noticias</h2>
                <Link to="/articulos" className="btn-outline btn-small">Ver todas</Link>
              </div>
              <div className="grid-auto-fill">
                {latestArticles.map(article => (
                  <Link key={article.id} to={`/articulos/${article.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card-brutalist" style={{ height: '100%' }}>
                      <div style={{ padding: '16px' }}>
                        <span className="tag tag-outline">{article.articleSection || 'Artículo'}</span>
                        <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-dark)' }}>
                          {article.title}
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          {formatDate(article.published_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Upcoming Events ── */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="section-separator">Eventos próximos</h2>
              <div className="grid-auto-fill">
                {upcomingEvents.map(event => (
                  <Link key={event.id} to={`/eventos/${event.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card-brutalist" style={{ height: '100%' }}>
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
                          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>
                            S/ {event.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Recent Courses ── */}
          {recentCourses.length > 0 && (
            <section>
              <h2 className="section-separator">Cursos disponibles</h2>
              <div className="grid-auto-fill">
                {recentCourses.map(course => (
                  <Link key={course.id} to={`/cursos/${course.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card-brutalist" style={{ height: '100%' }}>
                      <div style={{ padding: '16px' }}>
                        <span className="tag tag-outline">{course.modality === 'virtual' ? 'VIRTUAL' : course.modality === 'presencial' ? 'PRESENCIAL' : 'HÍBRIDO'}</span>
                        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)' }}>
                          {course.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          {course.description || ''}...
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Testimonials ── */}
          {testimonials.length > 0 && (
            <section>
              <h2 className="section-separator">Lo que dicen los profesionales</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {testimonials.map(t => (
                  <div key={t.id} className="card-brutalist" style={{ padding: '20px' }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.7, margin: 0, color: 'var(--text-dark)' }}>
                      "{t.content || t.testimonial}"
                    </p>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{t.author_name || 'Anónimo'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.author_title || t.role || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── CTA: Directory ── */}
          <section style={{
            margin: '50px 0',
            padding: 'clamp(30px, 5vw, 50px)',
            border: '1px solid var(--text-dark)',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(20px, 4vw, 32px)', marginBottom: '12px' }}>
              ¿Eres terapeuta de lenguaje?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              Únete al directorio profesional más grande del continente. Gratuito. 
              Conecta con colegas, pacientes y oportunidades.
            </p>
            <Link to="/directorio/inscribirse" className="btn-accent">Inscribirme gratis</Link>
          </section>

          {/* ── FAQs ── */}
          {faqs.length > 0 && (
            <section>
              <h2 className="section-separator">Preguntas frecuentes</h2>
              <div style={{ maxWidth: '700px' }}>
                {faqs.map(faq => (
                  <details key={faq.id} style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}>
                    <summary style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      listStyle: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      {faq.pregunta || faq.question}
                      <span style={{ fontSize: '18px', marginLeft: '10px' }}>+</span>
                    </summary>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '8px', marginBottom: 0 }}>
                      {faq.respuesta || faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── Newsletter CTA ── */}
          <section style={{
            margin: '50px 0 30px',
            padding: 'clamp(25px, 4vw, 40px)',
            background: 'var(--text-dark)',
            borderRadius: '12px',
            color: 'var(--text-light)',
            textAlign: 'center',
          }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 26px)', marginBottom: '10px' }}>
              Mantente al día
            </h2>
            <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '400px', margin: '0 auto 16px' }}>
              Recibe noticias, eventos y cursos directamente en tu bandeja. Sin spam, solo contenido de valor.
            </p>
            <form style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
              onSubmit={async (e) => {
                e.preventDefault()
                const email = e.target.email.value
                if (email) {
                  const { error } = await db.createSubscriber({ email })
                  if (!error) {
                    e.target.email.value = ''
                    alert('¡Gracias por suscribirte! Revisa tu correo para confirmar.')
                  }
                }
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                className="input-brutalist"
                style={{ flex: 1, minWidth: '200px', background: 'white' }}
              />
              <button type="submit" className="btn-accent btn-small">Suscribirme</button>
            </form>
          </section>

          {/* ── B2B CTA ── */}
          <section style={{
            margin: '30px 0 50px',
            padding: 'clamp(25px, 4vw, 40px)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 24px)', marginBottom: '8px' }}>
              Capacitaciones B2B
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 16px', lineHeight: 1.6 }}>
              Programas de formación corporativa para clínicas, hospitales y universidades. 
              Certificación profesional avalada.
            </p>
            <Link to="/capacitaciones-b2b" className="btn-primary">Más información</Link>
          </section>
        </>
      )}
    </>
  )
}
