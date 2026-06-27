import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { generateMetaTags } from '@/lib/seo.js'

export default function DescuentoDetalle() {
  const { slug } = useParams()
  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Descuento', description: 'Descuento exclusivo para la comunidad de terapeutas.' })} />
      <Link to="/descuentos" className="back-link">← Volver a descuentos</Link>
      <h1 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 34px)', marginBottom: '16px' }}>Descuento</h1>
      <p style={{ color: 'var(--text-muted)' }}>Detalles próximamente.</p>
    </>
  )
}
