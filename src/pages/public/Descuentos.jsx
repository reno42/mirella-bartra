import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Descuentos() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to fetch from any discount/partner table
    db.getCMSConfig('descuentos').then(({ data }) => {
      if (data?.value) {
        try { setDeals(JSON.parse(data.value)) } catch { setDeals([]) }
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Descuentos para Terapeutas', description: 'Descuentos exclusivos para terapeutas de lenguaje en cursos, herramientas y servicios.' })} />
      <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '30px' }}>Descuentos</h1>

      {loading ? <div style={{ padding: '40px 0', textAlign: 'center' }}><LoadingSpinner /></div> :
        deals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Próximamente tendremos descuentos exclusivos para la comunidad.</p>
        ) : (
          <div className="grid-auto-fill">
            {deals.map(d => (
              <Link key={d.id || d.slug} to={`/descuentos/${d.slug}`} className="card-brutalist" style={{ padding: '16px', textDecoration: 'none' }}>
                <span className="tag">DESCUENTO</span>
                <h3 className="font-sans" style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 4px', color: 'var(--text-dark)' }}>{d.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.description || ''}</p>
              </Link>
            ))}
          </div>
        )}
    </>
  )
}
