import { useState, useEffect } from 'react'
import { onLoadingChange } from '@/lib/loadingInterceptor.js'

export default function PageLoader() {
  const [show, setShow] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    let timer
    return onLoadingChange(({ loading }) => {
      if (loading) {
        setShow(true)
        setOpacity(0)
        timer = setTimeout(() => setOpacity(1), 100)
      } else {
        setOpacity(0)
        timer = setTimeout(() => setShow(false), 400)
      }
    })
  }, [])

  if (!show) return null

  return (
    <div
      className="page-loader"
      style={{
        opacity,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '2px',
        background: 'var(--accent-glow)',
        zIndex: 9999,
        transition: 'opacity 0.3s ease',
        animation: 'pageLoaderSlide 1.5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes pageLoaderSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
