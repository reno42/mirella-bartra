import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Página no encontrada | Mirella Bartra</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="font-display" style={{ fontSize: 'clamp(60px, 12vw, 120px)', lineHeight: 1, color: 'var(--text-dark)', marginBottom: '16px' }}>
          404
        </div>
        <h1 className="font-display" style={{ fontSize: 'clamp(20px, 4vw, 30px)', marginBottom: '12px' }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          La página que buscas no existe o ha sido movida. Vuelve al inicio para encontrar lo que necesitas.
        </p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    </>
  )
}
