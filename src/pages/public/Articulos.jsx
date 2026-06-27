import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Articulos() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getArticles({ limit: 50 }).then(({ data }) => {
      setArticles(data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const meta = generateMetaTags({
    title: 'Noticias y Artículos de Fonoaudiología',
    description: 'Noticias, investigaciones y artículos sobre terapia de lenguaje, habla, voz y deglución. Basados en evidencia.',
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
            Noticias
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
            Artículos, investigaciones y noticias sobre fonoaudiología y terapia de lenguaje.
          </p>

          {articles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay artículos publicados aún.</p>
          ) : (
            <div className="grid-auto-fill">
              {articles.map(article => (
                <Link key={article.id} to={`/articulos/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card-brutalist" style={{ height: '100%' }}>
                    {article.featured_image && (
                      <img src={article.featured_image} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '16px' }}>
                      {article.is_featured && <span className="tag" style={{ marginRight: '6px' }}>DESTACADO</span>}
                      <span className="tag tag-outline">{article.articleSection || 'Artículo'}</span>
                      <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px', color: 'var(--text-dark)', lineHeight: 1.3 }}>
                        {article.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {article.description || (article.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}...
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                        {formatDate(article.published_at)} · {article.reading_time || 5} min lectura
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
