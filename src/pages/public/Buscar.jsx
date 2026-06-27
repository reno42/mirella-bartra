import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Buscar() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    db.search(q).then(({ data }) => {
      setResults(data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [q])

  return (
    <>
      <Helmet {...generateMetaTags({ title: `Buscar: ${q}`, noindex: true })} />
      <h1 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 34px)', marginBottom: '20px' }}>
        Resultados para "{q}"
      </h1>

      {!q ? (
        <form style={{ display: 'flex', gap: '8px', maxWidth: '400px' }} onSubmit={e => { e.preventDefault(); window.location.href = `/buscar?q=${encodeURIComponent(e.target.q.value)}` }}>
          <input name="q" className="input-brutalist" placeholder="Buscar..." />
          <button type="submit" className="btn-primary btn-small">Buscar</button>
        </form>
      ) : loading ? (
        <LoadingSpinner />
      ) : results.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No se encontraron resultados.</p>
      ) : (
        <div className="grid-auto-fill">
          {results.map(r => (
            <Link key={r.id} to={r.url || `/articulos/${r.slug}`} className="card-brutalist" style={{ padding: '16px', textDecoration: 'none' }}>
              <span className="tag tag-outline">{r.type || 'Artículo'}</span>
              <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0', color: 'var(--text-dark)' }}>{r.title}</h3>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
