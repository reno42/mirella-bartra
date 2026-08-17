import { useEffect } from 'react'

/**
 * Ajusta el letter-spacing del elemento `targetRef` para que su ancho
 * renderizado coincida EXACTAMENTE con el ancho del elemento `baseRef`.
 *
 * Pensado para el lockup del logo: el descriptor queda del mismo ancho que
 * el wordmark (ni mayor ni menor) en cualquier breakpoint. Se re-aplica al
 * terminar de cargar las fuentes web y al redimensionar.
 */
export function useMatchWidth(baseRef, targetRef) {
  useEffect(() => {
    const base = baseRef.current
    const target = targetRef.current
    if (!base || !target) return

    const apply = () => {
      target.style.letterSpacing = '0px'
      const baseWidth = base.getBoundingClientRect().width
      const targetWidth = target.getBoundingClientRect().width
      // letter-spacing se añade después de CADA carácter (incluido el último)
      const chars = Math.max((target.textContent || '').length, 1)
      // Límite inferior para no compactar el texto hasta volverlo ilegible
      const spacing = Math.max((baseWidth - targetWidth) / chars, -0.5)
      target.style.letterSpacing = `${spacing.toFixed(3)}px`
    }

    apply()
    if (document.fonts?.ready) document.fonts.ready.then(apply).catch(() => {})
    const ro = new ResizeObserver(apply)
    ro.observe(base)
    return () => ro.disconnect()
  }, [baseRef, targetRef])
}
