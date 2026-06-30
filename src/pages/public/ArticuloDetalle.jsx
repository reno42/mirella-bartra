import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateArticleLD, generateBreadcrumbLD, generateMetaTags } from '@/lib/seo.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import NewsletterCTA from '@/components/NewsletterCTA.jsx'

export default function ArticuloDetalle() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getArticleBySlug(slug).then(({ data }) => {
      setArticle(data)
      if (data) {
        db.getRelatedArticles(data.id, 3).then(({ data: rel }) => setRelated(rel || []))
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
  }

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '12px' }}>Artículo no encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>El artículo que buscas no existe o ha sido removido.</p>
        <Link to="/articulos" className="btn-primary">Ver todos los artículos</Link>
      </div>
    )
  }

  const meta = generateMetaTags({
    title: article.title,
    description: article.description || (article.content || '').replace(/<[^>]*>/g, '').slice(0, 160),
    image: article.featured_image,
    url: `articulos/${article.slug}`,
    type: 'article',
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    keywords: article.keywords,
  })

  const articleLD = generateArticleLD(article)
  const breadcrumbLD = generateBreadcrumbLD([
    { name: 'Inicio', url: '/' },
    { name: 'Artículos', url: '/articulos' },
    { name: article.title },
  ])

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">{JSON.stringify([articleLD, breadcrumbLD])}</script>
      </Helmet>

      <Link to="/articulos" className="back-link">← Volver a artículos</Link>

      <article style={{ maxWidth: '760px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="tag">{article.articleSection || 'Artículo'}</span>
            {article.is_featured && <span className="tag" style={{ marginLeft: '6px' }}>DESTACADO</span>}
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', lineHeight: 1.15, marginBottom: '12px' }}>
            {article.title}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {formatDate(article.published_at)} · {article.reading_time || 5} min lectura · Por {article.author_name || 'Mirella Bartra'}
          </div>
          {article.description && (
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '12px 0 0' }}>
              {article.description}
            </p>
          )}
        </header>

        {article.featured_image && (
          <img
            src={article.featured_image}
            alt={article.title}
            style={{
              width: '100%',
              maxHeight: '420px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '1px solid var(--border-color)',
            }}
          />
        )}

        <div
          className="article-content"
          style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'var(--text-dark)',
          }}
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {article.keywords && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Palabras clave
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {article.keywords.split(',').map(k => (
                <span key={k.trim()} className="tag tag-outline">{k.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Citar en APA */}
        <div style={{ marginTop: '30px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#f9f9f7' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Citar en APA
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', lineHeight: 1.6 }}>
            Bartra, M. ({new Date(article.published_at).getFullYear()}). <em>{article.title}</em>. Mirella Bartra. https://mirellabartra.com/articulos/{article.slug}
          </p>
          <button
            className="btn-outline btn-small"
            style={{ marginTop: '10px' }}
            onClick={() => {
              const apa = `Bartra, M. (${new Date(article.published_at).getFullYear()}). ${article.title}. Mirella Bartra. https://mirellabartra.com/articulos/${article.slug}`
              navigator.clipboard.writeText(apa).then(() => alert('Referencia copiada al portapapeles'))
            }}
          >
            Copiar referencia
          </button>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section style={{ marginTop: '50px' }}>
          <h2 className="section-separator">Artículos relacionados</h2>
          <div className="grid-auto-fill">
            {related.map(a => (
              <Link key={a.id} to={`/articulos/${a.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card-brutalist" style={{ height: '100%' }}>
                  <div style={{ padding: '16px' }}>
                    <span className="tag tag-outline">{a.articleSection || 'Artículo'}</span>
                    <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-dark)' }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                      {formatDate(a.published_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <NewsletterCTA />

      <style>{`
        .article-content h2 { font-family: var(--font-display); font-size: 22px; margin: 28px 0 12px; text-transform: uppercase; }
        .article-content h3 { font-family: var(--font-sans); font-size: 17px; font-weight: 700; margin: 22px 0 8px; }
        .article-content p { margin: 0 0 16px; }
        .article-content ul, .article-content ol { margin: 0 0 16px; padding-left: 20px; }
        .article-content li { margin-bottom: 6px; }
        .article-content blockquote { border-left: 3px solid var(--accent-glow); padding-left: 16px; margin: 16px 0; color: var(--text-muted); font-style: italic; }
        .article-content a { color: var(--text-dark); font-weight: 600; text-decoration: underline; }
        .article-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; border: 1px solid var(--border-color); }
        .article-content pre { background: var(--text-dark); color: var(--text-light); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; font-family: var(--font-mono); }
        .article-content code { font-family: var(--font-mono); font-size: 13px; background: #e8e8e6; padding: 2px 6px; border-radius: 4px; }
        .article-content pre code { background: none; padding: 0; }
      `}</style>
    </>
  )
}
