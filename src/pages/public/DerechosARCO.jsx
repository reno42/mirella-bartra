import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function DerechosARCO() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.target)
    const request = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      request_type: formData.get('request_type'),
      message: formData.get('message'),
    }
    // Submit via leads with ARCO tag
    const { error } = await db.createLead({
      name: request.full_name,
      email: request.email,
      message: `SOLICITUD ARCO - Tipo: ${request.request_type}\n${request.message}`,
      source: 'derechos-arco',
    })
    setSubmitting(false)
    if (error) { alert('Error. Intenta de nuevo.') } else { setSubmitted(true) }
  }

  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Derechos ARCO', description: 'Ejerce tus derechos de Acceso, Rectificación, Cancelación y Oposición sobre tus datos personales.', noindex: true })} />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link to="/" className="back-link">← Volver al inicio</Link>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>Derechos ARCO</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          Acceso, Rectificación, Cancelación y Oposición sobre tus datos personales (Ley N° 29733, Perú).
        </p>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '20px' }}>Solicitud recibida</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Procesaremos tu solicitud en un máximo de 10 días hábiles.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input name="full_name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <select name="request_type" className="input-brutalist" required defaultValue="">
                <option value="" disabled>Selecciona el tipo de solicitud</option>
                <option value="acceso">Acceso - Quiero saber qué datos tienen sobre mí</option>
                <option value="rectificacion">Rectificación - Corregir mis datos</option>
                <option value="cancelacion">Cancelación - Eliminar mis datos</option>
                <option value="oposicion">Oposición - No usar mis datos para cierto fin</option>
              </select>
              <textarea name="message" className="input-brutalist" placeholder="Describe tu solicitud *" rows={4} required />
              <button type="submit" className="btn-primary btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
