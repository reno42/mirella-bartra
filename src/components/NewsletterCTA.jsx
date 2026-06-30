import { useState } from 'react'
import { db } from '@/lib/supabase.js'

export default function NewsletterCTA() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section style={{
      margin: '40px 0',
      padding: 'clamp(25px, 4vw, 40px)',
      background: 'var(--text-dark)',
      borderRadius: '12px',
      color: 'var(--text-light)',
      textAlign: 'center',
    }}>
      {submitted ? (
        <p style={{ fontSize: '16px', fontWeight: 700 }}>
          ¡Gracias por suscribirte! Revisa tu correo para confirmar.
        </p>
      ) : (
        <>
          <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 26px)', marginBottom: '10px' }}>
            Suscríbete al boletín
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '400px', margin: '0 auto 16px' }}>
            Recibe noticias, papers y eventos directamente en tu bandeja. Sin spam.
          </p>
          <form
            style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
            onSubmit={async (e) => {
              e.preventDefault()
              const email = e.target.email.value
              if (email) {
                const { error } = await db.createSubscriber({ email, source: 'newsletter_cta' })
                if (!error) {
                  setSubmitted(true)
                  e.target.email.value = ''
                }
              }
            }}
          >
            <input
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="input-brutalist"
              style={{ flex: 1, minWidth: '200px', background: 'white' }}
            />
            <button type="submit" className="btn-accent btn-small">Suscribirme</button>
          </form>
        </>
      )}
    </section>
  )
}
