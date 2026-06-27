import { useState, useEffect } from 'react'
import { hasConsent, acceptAll, acceptEssentialOnly } from '@/utils/consentManager.js'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasConsent()) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="container cookie-inner">
        <p className="cookie-text">
          Usamos cookies propias y de terceros para analítica y mejorar tu experiencia. 
          Puedes aceptar todas o solo las esenciales.{' '}
          <a href="/legal/politica-de-cookies" style={{ color: 'var(--accent-glow)', fontWeight: 600 }}>
            Más información
          </a>
        </p>
        <div className="cookie-actions">
          <button className="btn-primary btn-small" onClick={() => { acceptAll(); setVisible(false) }}>
            Aceptar todas
          </button>
          <button className="btn-outline btn-small" onClick={() => { acceptEssentialOnly(); setVisible(false) }}>
            Solo esenciales
          </button>
        </div>
      </div>

      <style>{`
        .cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--text-dark);
          color: var(--text-light);
          z-index: 999;
          padding: 16px 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          animation: toastIn 0.4s ease;
        }
        .cookie-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .cookie-text {
          font-size: 12px;
          margin: 0;
          flex: 1;
          min-width: 220px;
          color: #ccc;
          line-height: 1.5;
        }
        .cookie-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .cookie-actions .btn-primary {
          background: var(--accent-glow);
          color: var(--text-dark);
          border-color: var(--accent-glow);
        }
        .cookie-actions .btn-primary:hover {
          background: var(--text-light);
          color: var(--text-dark);
          border-color: var(--text-light);
        }
        .cookie-actions .btn-outline {
          border-color: rgba(255,255,255,0.4);
          color: var(--text-light);
        }
        .cookie-actions .btn-outline:hover {
          background: var(--text-light);
          color: var(--text-dark);
        }
      `}</style>
    </div>
  )
}
