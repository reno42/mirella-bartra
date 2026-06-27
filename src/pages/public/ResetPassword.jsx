import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { auth } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await auth.resetPassword(email)
    setLoading(false)
    if (error) {
      alert('Error al enviar. Verifica el correo e intenta de nuevo.')
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <Helmet>
        <title>Recuperar Contraseña | Mirella Bartra</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div style={{ maxWidth: '400px', margin: '60px auto' }}>
        <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>
          Recuperar Contraseña
        </h1>
        {sent ? (
          <div className="card-brutalist" style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Te hemos enviado un enlace de recuperación a tu correo.
            </p>
            <Link to="/login" className="btn-primary btn-small">Volver a Ingresar</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <input
              type="email"
              className="input-brutalist"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ marginBottom: '14px' }}
            />
            <button type="submit" className="btn-primary btn-small" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
