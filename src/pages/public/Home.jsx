import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateOrganizationLD, generateWebSiteLD, generatePersonLD, generateFAQPageLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate, daysUntil, isDateInFuture } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import NewsletterCTA from '@/components/NewsletterCTA.jsx'

const CATEGORIES = [
  { label: 'Inicio', route: '/' },
  { label: 'Noticias', route: '/articulos' },
  { label: 'Papers Académicos', route: '/papers' },
  { label: 'Congresos', route: '/congresos' },
  { label: 'Directorio', route: '/directorio' },
  { label: 'Nosotros', route: '/nosotros' },
]

export default function Home() {
  const [allArticles, setAllArticles] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentCourses, setRecentCourses] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      db.getArticles({ limit: 12 }),
      db.getEvents({ upcoming: true }),
      db.getCourses(),
      db.getTestimonials(),
      db.getFAQs('page', 'home'),
    ]).then(([articlesRes, eventsRes, coursesRes, testimonialsRes, faqsRes]) => {
      setAllArticles(articlesRes.data || [])
      setUpcomingEvents((eventsRes.data || []).filter(e => isDateInFuture(e.start_date)).slice(0, 3))
      setRecentCourses((coursesRes.data || []).slice(0, 3))
      setTestimonials((testimonialsRes.data || []).slice(0, 5))
      setFaqs(faqsRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Fonoaudiología · Noticias, Papers y Formación',
    description: 'El primer medio de prensa digital de fonoaudiología en Latinoamérica. Noticias basadas en evidencia, papers académicos, congresos y directorio profesional.',
    type: 'website',
  })

  const organizationLD = generateOrganizationLD()
  const webSiteLD = generateWebSiteLD()
  const personLD = generatePersonLD()
  const faqLD = generateFAQPageLD(faqs, '')
  const breadcrumbLD = generateBreadcrumbLD([{ name: 'Inicio', url: '/' }])
  const allSchema = [organizationLD, webSiteLD, personLD, breadcrumbLD]
  if (faqLD) allSchema.push(faqLD)

  // Separate articles into news vs papers
  const newsArticles = allArticles.filter(
    (a) => !isPaper(a)
  )
  const paperArticles = allArticles.filter(isPaper)

  // Featured layout
  const leadArticle = newsArticles[0]
  const sideArticles = newsArticles.slice(1, 4)
  const moreNews = newsArticles.slice(4, 8)
  const morePapers = paperArticles.slice(0, 4)

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const congresosItems = [
    ...recentCourses.map(c => ({ ...c, _route: `/cursos/${c.slug}` })),
    ...upcomingEvents.map(e => ({ ...e, _route: `/eventos/${e.slug}` })),
  ]

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
          {/* ── Masthead ── */}
          <div className="press-masthead">
            <h1>FONOAUDIOLOGÍA</h1>
            <div className="press-subtitle">Noticias · Papers · Congresos · Comunidad</div>
          </div>

          {/* ── Dateline ── */}
          <div className="press-dateline">
            <span>{today}</span>
            <span>Edición Digital · N° 001</span>
          </div>

          {/* ── Category Bar ── */}
          <div className="press-category-bar">
            {CATEGORIES.map((cat) => (
              <Link key={cat.route} to={cat.route} className="press-category-link">
                {cat.label}
              </Link>
            ))}
          </div>

          {/* ── Featured Layout ── */}
          {leadArticle && (
            <div className="press-featured-layout">
              <Link to={`/articulos/${leadArticle.slug}`} className="press-lead-story">
                {leadArticle.featured_image ? (
                  <img src={leadArticle.featured_image} alt="" />
                ) : (
                  <div className="press-no-image" style={{ height: 'clamp(200px, 30vw, 360px)', marginBottom: '16px' }}>
                    {leadArticle.title.charAt(0)}
                  </div>
                )}
                <div className="press-lead-category">
                  {leadArticle.articleSection || 'Noticia'} · Destacado
                </div>
                <div className="press-lead-title">{leadArticle.title}</div>
                <div className="press-lead-excerpt">
                  {leadArticle.description ||
                    (leadArticle.content || '').replace(/<[^>]*>/g, '').slice(0, 200)}
                  ...
                </div>
                <div className="press-lead-meta">
                  {formatDate(leadArticle.published_at)} · {leadArticle.reading_time || 5} min lectura
                  {leadArticle.author && ` · ${leadArticle.author}`}
                </div>
              </Link>

              {/* Side Stories */}
              {sideArticles.length > 0 && (
                <div className="press-side-stories">
                  {sideArticles.map((article) => (
                    <Link key={article.id} to={`/articulos/${article.slug}`} className="press-side-story">
                      {article.featured_image && (
                        <img src={article.featured_image} alt="" />
                      )}
                      <div>
                        <div className="press-side-category">
                          {article.articleSection || 'Noticia'}
                        </div>
                        <div className="press-side-title">{article.title}</div>
                        <div className="press-side-meta">
                          {formatDate(article.published_at)} · {article.reading_time || 5} min
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── More News Section ── */}
          {moreNews.length > 0 && (
            <>
              <div className="press-section-header">
                <h2>Más Noticias</h2>
                <Link to="/articulos">Ver todas</Link>
              </div>
              <div className="press-article-grid">
                {moreNews.map((article) => (
                  <Link key={article.id} to={`/articulos/${article.slug}`} className="press-article-card">
                    {article.featured_image ? (
                      <img src={article.featured_image} alt="" />
                    ) : (
                      <div className="press-no-image" style={{ height: '180px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}>
                        {article.title.charAt(0)}
                      </div>
                    )}
                    <div className="press-article-card-body">
                      <div className="press-card-category">{article.articleSection || 'Noticia'}</div>
                      <h3>{article.title}</h3>
                      <p>
                        {article.description ||
                          (article.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}
                        ...
                      </p>
                      <div className="press-card-meta">
                        {formatDate(article.published_at)} · {article.reading_time || 5} min
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── Papers Académicos Section ── */}
          {morePapers.length > 0 && (
            <>
              <div className="press-section-header">
                <h2>Papers Académicos</h2>
                <Link to="/papers">Ver todos</Link>
              </div>
              <div className="press-article-grid">
                {morePapers.map((article) => (
                  <Link key={article.id} to={`/articulos/${article.slug}`} className="press-article-card">
                    {article.featured_image ? (
                      <img src={article.featured_image} alt="" />
                    ) : (
                      <div className="press-no-image" style={{ height: '180px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}>
                        {article.title.charAt(0)}
                      </div>
                    )}
                    <div className="press-article-card-body">
                      <div className="press-card-category">{article.articleSection || 'Paper'}</div>
                      <h3>{article.title}</h3>
                      <p>
                        {article.description ||
                          (article.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}
                        ...
                      </p>
                      <div className="press-card-meta">
                        {formatDate(article.published_at)} · {article.reading_time || 8} min
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── Congresos Preview ── */}
          {congresosItems.length > 0 && (
            <>
              <div className="press-section-header">
                <h2>Congresos y Formación</h2>
                <Link to="/congresos">Ver todos</Link>
              </div>
              <div className="grid-auto-fill">
                {congresosItems.slice(0, 3).map((item) => (
                  <Link key={`${item.id}-${item.slug}`} to={item._route} style={{ textDecoration: 'none' }}>
                    <div className="card-brutalist" style={{ height: '100%' }}>
                      <div style={{ padding: '16px' }}>
                        <span className="tag">
                          {item.modality === 'virtual' ? 'VIRTUAL' : item.event_status === 'ongoing' ? 'EN VIVO' : 'PRÓXIMO'}
                        </span>
                        <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)', lineHeight: 1.3 }}>
                          {item.title}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          📅 {formatDate(item.start_date)}
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
            </>
          )}

          {/* ── Metrics Strip ── */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            padding: '20px 0',
            margin: '40px 0',
            display: 'flex',
            gap: 'clamp(20px, 5vw, 60px)',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '150+', label: 'Artículos publicados' },
              { value: '20+', label: 'Congresos y cursos' },
              { value: '3,000+', label: 'Terapeutas en directorio' },
              { value: '10,000+', label: 'Lectores' },
            ].map(m => (
              <div key={m.label}>
                <div className="font-display" style={{ fontSize: '24px', lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* ── Directory CTA ── */}
          <section style={{
            margin: '30px 0',
            padding: 'clamp(30px, 5vw, 50px)',
            border: '1px solid var(--text-dark)',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(20px, 4vw, 32px)', marginBottom: '12px' }}>
              ¿Eres terapeuta de lenguaje?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              Únete al directorio profesional más grande de fonoaudiología en Latinoamérica. Gratuito.
            </p>
            <Link to="/directorio/inscribirse" className="btn-accent">Inscribirme gratis</Link>
          </section>

          {/* ── Newsletter CTA ── */}
          <NewsletterCTA />
        </>
      )}
    </>
  )
}

// Helper: detect if an article is an academic paper
function isPaper(a) {
  const section = (a.articleSection || '').toLowerCase()
  const category = (a.category || '').toLowerCase()
  return (
    section.includes('paper') ||
    section.includes('académic') ||
    section.includes('academic') ||
    category.includes('paper') ||
    category.includes('investigación')
  )
}
