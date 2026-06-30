import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import NewsletterCTA from '@/components/NewsletterCTA.jsx'

const NEWS_SECTIONS = [
  'Todos',
  'Lenguaje',
  'Habla',
  'Voz',
  'Deglución',
  'Neurociencia',
  'Audición',
  'Tecnología',
]

const NAV_CATEGORIES = [
  { label: 'Inicio', route: '/' },
  { label: 'Noticias', route: '/articulos' },
  { label: 'Papers', route: '/papers' },
  { label: 'Congresos', route: '/congresos' },
  { label: 'Directorio', route: '/directorio' },
  { label: 'Nosotros', route: '/nosotros' },
]

export default function Articulos() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Todos')

  useEffect(() => {
    db.getArticles({ limit: 50 }).then(({ data }) => {
      // Filter out academic papers
      const newsOnly = (data || []).filter((a) => !isPaper(a))
      setArticles(newsOnly)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Noticias de Fonoaudiología',
    description: 'Noticias, investigación y actualidad sobre terapia de lenguaje, habla, voz y deglución. Basadas en evidencia.',
    type: 'website',
  })

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const filteredArticles =
    activeFilter === 'Todos'
      ? articles
      : articles.filter(
          (a) =>
            (a.articleSection || '').toLowerCase().includes(activeFilter.toLowerCase()) ||
            (a.category || '').toLowerCase().includes(activeFilter.toLowerCase())
        )

  const leadArticle = filteredArticles[0]
  const sideArticles = filteredArticles.slice(1, 4)
  const gridArticles = filteredArticles.slice(4)

  return (
    <>
      <Helmet {...meta} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner size={36} />
        </div>
      ) : (
        <>
          {/* Masthead */}
          <div className="press-masthead">
            <h1>NOTICIAS</h1>
            <div className="press-subtitle">Actualidad · Investigación · Comunidad</div>
          </div>

          {/* Dateline */}
          <div className="press-dateline">
            <span>{today}</span>
            <span>Edición Digital</span>
          </div>

          {/* Category Bar — same as Home (page navigation) */}
          <div className="press-category-bar">
            {NAV_CATEGORIES.map((cat) => (
              <Link key={cat.route} to={cat.route} className="press-category-link">
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Topic Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {NEWS_SECTIONS.map((cat) => (
              <button
                key={cat}
                className={`tag ${activeFilter === cat ? '' : 'tag-outline'}`}
                onClick={() => setActiveFilter(cat)}
                style={{ cursor: 'pointer' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '40px 0' }}>
              No hay noticias publicadas en esta categoría.
            </p>
          ) : (
            <>
              {/* Featured Layout */}
              {leadArticle && (
                <div className="press-featured-layout">
                  <Link to={`/articulos/${leadArticle.slug}`} className="press-lead-story">
                    {leadArticle.featured_image ? (
                      <img src={leadArticle.featured_image} alt="" />
                    ) : (
                      <div className="press-no-image" style={{ height: 'clamp(200px, 30vw, 360px)', marginBottom: '16px', borderRadius: '8px' }}>
                        {leadArticle.title.charAt(0)}
                      </div>
                    )}
                    <div className="press-lead-category">
                      {leadArticle.articleSection || 'Noticia'}
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
                              {formatDate(article.published_at)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grid Articles */}
              {gridArticles.length > 0 && (
                <>
                  <div className="press-section-header">
                    <h2>Más Noticias</h2>
                  </div>
                  <div className="press-article-grid">
                    {gridArticles.map((article) => (
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
            </>
          )}
          <NewsletterCTA />
        </>
      )}
    </>
  )
}

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
