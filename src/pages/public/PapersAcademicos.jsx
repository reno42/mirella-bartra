import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const PAPER_SECTIONS = [
  'Todos',
  'Lenguaje',
  'Habla',
  'Voz',
  'Deglución',
  'Neurociencia',
  'Audición',
]

export default function PapersAcademicos() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Todos')

  useEffect(() => {
    db.getArticles({ limit: 50 }).then(({ data }) => {
      const filtered = (data || []).filter(
        (a) =>
          (a.articleSection || '').toLowerCase().includes('paper') ||
          (a.articleSection || '').toLowerCase().includes('académic') ||
          (a.articleSection || '').toLowerCase().includes('academic') ||
          (a.category || '').toLowerCase().includes('paper') ||
          (a.category || '').toLowerCase().includes('investigación')
      )
      setPapers(filtered)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Papers Académicos de Fonoaudiología',
    description: 'Investigación y papers académicos sobre terapia de lenguaje, habla, voz y deglución. Basados en evidencia.',
    type: 'website',
  })

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const filteredPapers =
    activeFilter === 'Todos'
      ? papers
      : papers.filter(
          (p) =>
            (p.articleSection || '').toLowerCase().includes(activeFilter.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(activeFilter.toLowerCase())
        )

  const featuredPaper = filteredPapers[0]
  const sidePapers = filteredPapers.slice(1, 4)
  const gridPapers = filteredPapers.slice(4)

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
            <h1>PAPERS ACADÉMICOS</h1>
            <div className="press-subtitle">Investigación · Evidencia · Ciencia</div>
          </div>

          {/* Dateline */}
          <div className="press-dateline">
            <span>{today}</span>
            <span>Edición Digital</span>
          </div>

          {/* Category Bar */}
          <div className="press-category-bar">
            {PAPER_SECTIONS.map((cat) => (
              <button
                key={cat}
                className={`press-category-link ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredPapers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '40px 0' }}>
              No hay papers académicos publicados aún en esta categoría.
            </p>
          ) : (
            <>
              {/* Featured Layout */}
              {featuredPaper && (
                <div className="press-featured-layout">
                  <Link to={`/articulos/${featuredPaper.slug}`} className="press-lead-story">
                    {featuredPaper.featured_image ? (
                      <img src={featuredPaper.featured_image} alt="" />
                    ) : (
                      <div className="press-no-image" style={{ height: 'clamp(200px, 30vw, 360px)', marginBottom: '16px', borderRadius: '8px' }}>
                        {featuredPaper.title.charAt(0)}
                      </div>
                    )}
                    <div className="press-lead-category">
                      {featuredPaper.articleSection || 'Paper Académico'}
                    </div>
                    <div className="press-lead-title">{featuredPaper.title}</div>
                    <div className="press-lead-excerpt">
                      {featuredPaper.description ||
                        (featuredPaper.content || '').replace(/<[^>]*>/g, '').slice(0, 200)}
                      ...
                    </div>
                    <div className="press-lead-meta">
                      {formatDate(featuredPaper.published_at)} · {featuredPaper.reading_time || 8} min lectura
                      {featuredPaper.author && ` · ${featuredPaper.author}`}
                    </div>
                  </Link>

                  {/* Side Stories */}
                  {sidePapers.length > 0 && (
                    <div className="press-side-stories">
                      {sidePapers.map((paper) => (
                        <Link key={paper.id} to={`/articulos/${paper.slug}`} className="press-side-story">
                          {paper.featured_image && (
                            <img src={paper.featured_image} alt="" />
                          )}
                          <div>
                            <div className="press-side-category">
                              {paper.articleSection || 'Paper'}
                            </div>
                            <div className="press-side-title">{paper.title}</div>
                            <div className="press-side-meta">
                              {formatDate(paper.published_at)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grid Papers */}
              {gridPapers.length > 0 && (
                <>
                <div className="press-section-header">
                  <h2>Más Investigaciones</h2>
                </div>
                <div className="press-article-grid">
                  {gridPapers.map((paper) => (
                    <Link key={paper.id} to={`/articulos/${paper.slug}`} className="press-article-card">
                      {paper.featured_image ? (
                        <img src={paper.featured_image} alt="" />
                      ) : (
                        <div className="press-no-image" style={{ height: '180px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}>
                          {paper.title.charAt(0)}
                        </div>
                      )}
                      <div className="press-article-card-body">
                        <div className="press-card-category">
                          {paper.articleSection || 'Paper Académico'}
                        </div>
                        <h3>{paper.title}</h3>
                        <p>
                          {paper.description ||
                            (paper.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}
                          ...
                        </p>
                        <div className="press-card-meta">
                          {formatDate(paper.published_at)} · {paper.reading_time || 8} min
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
