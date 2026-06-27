import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function TrabajaConNosotros() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const token = await getToken('job_application')
    const formData = new FormData(e.target)
    const lead = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: `Puesto: ${formData.get('role')}\nMensaje: ${formData.get('message')}`,
      source: 'trabaja-con-nosotros',
      recaptcha_token: token,
    }
    const { error } = await db.createLead(lead)
    setSubmitting(false)
    if (error) { alert('Error. Intenta de nuevo.') } else { setSubmitted(true) }
  }

  return (
    <>
      <Helmet {...generateMetaTags({ title: 'Trabaja con Nosotros', description: 'Únete al equipo de Mirella Bartra. Buscamos terapeutas y profesionales apasionados.' })} />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>Trabaja con Nosotros</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          ¿Quieres formar parte de este proyecto? Envíanos tu información.
        </p>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '20px' }}>¡Postulación enviada!</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Revisaremos tu perfil y te contactaremos si hay match.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input name="name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono" />
              <input name="role" className="input-brutalist" placeholder="¿Qué rol te interesa?" />
              <textarea name="message" className="input-brutalist" placeholder="Cuéntanos sobre ti y por qué quieres unirte" rows={4} />
              <button type="submit" className="btn-accent btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar postulación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
