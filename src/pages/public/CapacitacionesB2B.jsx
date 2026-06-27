import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function CapacitacionesB2B() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const token = await getToken('b2b')
    const formData = new FormData(e.target)
    const lead = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: `Institución: ${formData.get('institution')}\nParticipantes: ${formData.get('participants')}\nMensaje: ${formData.get('message')}`,
      source: 'b2b',
      recaptcha_token: token,
    }
    const { error } = await db.createLead(lead)
    setSubmitting(false)
    if (error) { alert('Error. Intenta de nuevo.') } else { setSubmitted(true) }
  }

  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Capacitaciones B2B', description: 'Programas de formación corporativa para clínicas, hospitales y universidades.' })} />
      <Link to="/cursos" className="back-link">← Volver a cursos</Link>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>
          Capacitaciones B2B
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          Programas de formación corporativa para clínicas, hospitales y universidades. Certificación profesional avalada.
        </p>

        <div style={{ marginBottom: '30px' }}>
          <h2 className="font-display" style={{ fontSize: '18px', marginBottom: '12px' }}>¿Qué ofrecemos?</h2>
          <ul style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 2 }}>
            <li>Capacitaciones personalizadas para equipos de fonoaudiología</li>
            <li>Talleres presenciales y virtuales</li>
            <li>Certificación institucional</li>
            <li>Planes flexibles según cantidad de participantes</li>
            <li>Seguimiento y evaluación de resultados</li>
          </ul>
        </div>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '20px' }}>¡Solicitud enviada!</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Te contactaremos para discutir tu programa.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <h2 className="font-display" style={{ fontSize: '16px', marginBottom: '16px' }}>Solicitar información</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input name="name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono" />
              <input name="institution" className="input-brutalist" placeholder="Institución *" required />
              <input name="participants" type="number" className="input-brutalist" placeholder="Cantidad aproximada de participantes" />
              <textarea name="message" className="input-brutalist" placeholder="Mensaje adicional" rows={3} />
              <button type="submit" className="btn-accent btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Solicitar información'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
