import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { generateMetaTags } from '@/lib/seo.js'

export default function Descargables() {
  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Descargables', description: 'Recursos descargables gratuitos y de pago para terapeutas de lenguaje.' })} />
      <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>Descargables</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
        Recursos descargables para terapeutas. Algunos gratuitos, otros requieren depósito previo.
      </p>

      <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
          Próximamente: guías clínicas, protocolos de evaluación, material terapéutico imprimible.
        </p>
        <Link to="/cursos" className="btn-primary btn-small">Ver cursos disponibles</Link>
      </div>
    </>
  )
}
