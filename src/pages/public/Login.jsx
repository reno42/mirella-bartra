import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { auth } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authError } = await auth.signIn(email, password)
    setLoading(false)
    if (authError) {
      setError('Credenciales incorrectas. Intenta de nuevo.')
    } else {
      navigate(from, { replace: true })
    }
  }

  const meta = generateMetaTags({
    title: 'Ingresar',
    description: 'Accede al panel de administración de Mirella Bartra.',
    noindex: true,
  })

  return (
    <>
      <Helmet {...meta} />
      <div style={{ maxWidth: '400px', margin: '60px auto' }}>
        <h1 className="font-display" style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
          Ingresar
        </h1>

        <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '10px', background: '#fde8e8', borderRadius: '6px', fontSize: '12px', color: '#111', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gap: '14px' }}>
            <input
              type="email"
              className="input-brutalist"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="input-brutalist"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary btn-small" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/reset-password" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
