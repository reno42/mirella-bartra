import { useState, useEffect } from 'react'
import { db } from '@/lib/supabase.js'

const STORAGE_KEY = 'mirella_popup_seen_v1'
const POPUP_DELAY = 3500 // ms after page load
const POPUP_EXPIRY_DAYS = 7 // re-show after 7 days

const DEFAULT_POPUP = {
  enabled: true,
  title: '¡20% de Descuento!',
  subtitle: 'Suscríbete y obtén 20% OFF en tu primer taller o congreso',
  discount_percent: 20,
  offer_type: 'talleres y congresos',
  cta_text: 'Quiero mi descuento',
  success_message: '¡Listo! Revisa tu correo para recibir tu código de descuento.',
}

export default function DiscountPopup() {
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState(DEFAULT_POPUP)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Load popup config from CMS
  useEffect(() => {
    const keys = [
      'popup_enabled',
      'popup_title',
      'popup_subtitle',
      'popup_discount_percent',
      'popup_offer_type',
      'popup_cta_text',
      'popup_success_message',
    ]
    Promise.all(keys.map((k) => db.getCMSConfig(k)))
      .then((results) => {
        const merged = { ...DEFAULT_POPUP }
        results.forEach(({ data }, i) => {
          if (!data) return
          const key = keys[i]
          let val = data.value
          if (key === 'popup_enabled') val = val === 'true'
          if (key === 'popup_discount_percent') val = parseInt(val) || DEFAULT_POPUP.discount_percent
          merged[key.replace('popup_', '').replace('discount_', 'discount_')] = val
        })
        setConfig(merged)
      })
      .catch(() => setConfig(DEFAULT_POPUP))
  }, [])

  // Show popup after delay if not seen recently
  useEffect(() => {
    if (!config.enabled) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const age = Date.now() - parseInt(stored)
      if (age < POPUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000) return
    }

    const timer = setTimeout(() => setVisible(true), POPUP_DELAY)
    return () => clearTimeout(timer)
  }, [config.enabled])

  const closePopup = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const name = e.target.name.value.trim()
    const email = e.target.email.value.trim()
    if (!name || !email) {
      setSubmitting(false)
      return
    }

    // 1. Create subscriber
    await db.createSubscriber({
      email,
      full_name: name,
      source: 'discount_popup',
      is_active: true,
    })

    // 2. Create lead
    await db.createLead({
      name,
      email,
      source: 'discount_popup',
      type: 'discount_request',
      message: `Solicita descuento del ${config.discount_percent}% en ${config.offer_type}`,
      status: 'nuevo',
    })

    setSubmitting(false)
    setDone(true)
    localStorage.setItem(STORAGE_KEY, String(Date.now()))

    // Auto-close after showing success
    setTimeout(() => setVisible(false), 4000)
  }

  if (!visible) return null

  return (
    <div className="discount-popup-overlay" onClick={closePopup}>
      <div className="discount-popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="discount-popup-close" onClick={closePopup} aria-label="Cerrar">
          &times;
        </button>

        {!done ? (
          <>
            <div className="discount-popup-badge">
              {config.discount_percent}% OFF
            </div>
            <h2 className="discount-popup-title font-display">
              {config.title}
            </h2>
            <p className="discount-popup-subtitle">
              {config.subtitle}
            </p>
            <p className="discount-popup-offer">
              Válido para: <strong>{config.offer_type}</strong>
            </p>

            <form className="discount-popup-form" onSubmit={handleSubmit}>
              <input
                name="name"
                type="text"
                placeholder="Tu nombre"
                required
                className="input-brutalist"
                style={{ background: 'white' }}
              />
              <input
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                className="input-brutalist"
                style={{ background: 'white' }}
              />
              <button type="submit" className="btn-accent" disabled={submitting}>
                {submitting ? 'Enviando...' : config.cta_text}
              </button>
            </form>

            <button className="discount-popup-dismiss" onClick={closePopup}>
              No, gracias
            </button>
          </>
        ) : (
          <div className="discount-popup-success">
            <div className="discount-popup-success-icon">&#10003;</div>
            <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '8px' }}>
              ¡Genial!
            </h2>
            <p>{config.success_message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
