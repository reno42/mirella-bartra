import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function Contacto() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const token = await getToken('contact')
    const formData = new FormData(e.target)
    const lead = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      source: 'contacto',
      recaptcha_token: token,
    }
    const { error } = await db.createLead(lead)
    setSubmitting(false)
    if (error) {
      alert('Error al enviar. Intenta de nuevo.')
    } else {
      setSubmitted(true)
    }
  }

  const meta = generateMetaTags({
    title: 'Contacto',
    description: 'Contáctanos para consultas, colaboraciones o cualquier duda sobre terapia de lenguaje.',
    type: 'website',
  })

  return (
    <>
      <Helmet {...meta} />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>Contacto</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          ¿Tienes una consulta, propuesta o quieres colaborar? Escríbenos.
        </p>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '8px' }}>¡Mensaje enviado!</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Te responderemos a la brevedad posible.
            </p>
            <Link to="/" className="btn-primary btn-small" style={{ marginTop: '16px', display: 'inline-flex' }}>Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <input name="name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono (opcional)" />
              <textarea name="message" className="input-brutalist" placeholder="Tu mensaje *" rows={5} required />
              <button type="submit" className="btn-accent btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
