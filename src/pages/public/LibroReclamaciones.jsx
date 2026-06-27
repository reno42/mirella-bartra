import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function LibroReclamaciones() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.target)
    const complaint = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      type: formData.get('type'),
      description: formData.get('description'),
    }
    const { error } = await db.createComplaint(complaint)
    setSubmitting(false)
    if (error) { alert('Error al enviar. Intenta de nuevo.') } else { setSubmitted(true) }
  }

  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Libro de Reclamaciones', description: 'Presenta tu queja o reclamo. Respondemos en un máximo de 15 días hábiles.', noindex: true })} />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link to="/" className="back-link">← Volver al inicio</Link>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>Libro de Reclamaciones</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571).
        </p>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '20px' }}>Reclamo registrado</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Responderemos en un máximo de 15 días hábiles.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input name="full_name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono" />
              <select name="type" className="input-brutalist" required defaultValue="">
                <option value="" disabled>Selecciona el tipo</option>
                <option value="queja">Queja - Malestar sobre el servicio</option>
                <option value="reclamo">Reclamo - Exigir solución a un problema</option>
              </select>
              <textarea name="description" className="input-brutalist" placeholder="Describe tu queja o reclamo *" rows={4} required />
              <button type="submit" className="btn-primary btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar reclamo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
