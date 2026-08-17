import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/supabase.js'

// Barra superior negra con las frases en movimiento.
// Las frases se administran desde el intranet (/admin/ticker) y viven
// en Supabase (ticker_messages). Sin frases activas → no renderiza nada.
export default function TopTicker() {
  const [messages, setMessages] = useState([])
  const [duration, setDuration] = useState(null)
  const trackRef = useRef(null)

  useEffect(() => {
    db.getTickerMessages()
      .then(({ data }) => setMessages((data || []).map((m) => m.text)))
      .catch(() => {})
  }, [])

  // Duración proporcional al ancho del contenido (~65px/s) para que
  // el scroll se vea natural sin importar cuántas frases haya.
  useEffect(() => {
    if (messages.length === 0) return
    const track = trackRef.current
    if (!track) return
    const apply = () => {
      const width = track.getBoundingClientRect().width / 2 // un solo grupo
      if (width > 0) setDuration(Math.max(Math.round(width / 65), 12))
    }
    apply()
    if (document.fonts?.ready) document.fonts.ready.then(apply).catch(() => {})
    const ro = new ResizeObserver(apply)
    ro.observe(track)
    return () => ro.disconnect()
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div className="top-ticker" role="region" aria-label="Anuncios">
      <div
        className="ticker-track"
        ref={trackRef}
        style={duration ? { animationDuration: `${duration}s` } : undefined}
      >
        {/* El contenido se duplica para un loop continuo y sin cortes */}
        {[0, 1].map((copy) => (
          <div key={copy} className="ticker-group" aria-hidden={copy === 1}>
            {messages.map((text, i) => (
              <span key={`${copy}-${i}`} className="ticker-item">
                <span className="ticker-sep">◆</span>
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
