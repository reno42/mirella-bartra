import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import { useRecaptcha } from '@/hooks/useRecaptcha.js'

export default function DirectorioForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getToken } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const token = await getToken('directory_signup')
    const formData = new FormData(e.target)
    const entry = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      specialty: formData.get('specialty'),
      city: formData.get('city'),
      years_experience: parseInt(formData.get('years_experience')) || 0,
      bio: formData.get('bio'),
      consent_given: formData.get('consent') === 'on',
      recaptcha_token: token,
    }
    const { error } = await db.createDirectoryEntry(entry)
    setSubmitting(false)
    if (error) {
      alert('Error al enviar la solicitud. Intenta de nuevo.')
    } else {
      setSubmitted(true)
    }
  }

  const meta = generateMetaTags({
    title: 'Inscribirte en el Directorio',
    description: 'Únete al directorio profesional de terapeutas de lenguaje más grande del continente. Gratuito.',
    type: 'website',
  })

  return (
    <>
      <Helmet {...meta} />
      <Link to="/directorio" className="back-link">← Volver al directorio</Link>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>
          Inscripción al Directorio
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          Forma parte de la comunidad profesional de terapeutas de lenguaje. Gratuito y sin compromiso.
        </p>

        {submitted ? (
          <div className="card-brutalist" style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '8px' }}>¡Solicitud enviada!</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Revisaremos tu información y te notificaremos cuando esté publicada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <input name="full_name" className="input-brutalist" placeholder="Nombre completo *" required />
              <input name="email" type="email" className="input-brutalist" placeholder="Correo electrónico *" required />
              <input name="phone" type="tel" className="input-brutalist" placeholder="Teléfono" />
              <input name="specialty" className="input-brutalist" placeholder="Especialidad (ej. Lenguaje, Voz, Habla)" />
              <input name="city" className="input-brutalist" placeholder="Ciudad" />
              <input name="years_experience" type="number" className="input-brutalist" placeholder="Años de experiencia" min="0" />
              <textarea name="bio" className="input-brutalist" placeholder="Biografía profesional (breve)" rows={4} />
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" name="consent" required />
                Autorizo la publicación de mis datos en el directorio público.
              </label>
              <button type="submit" className="btn-accent btn-small" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
