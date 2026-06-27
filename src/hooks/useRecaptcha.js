import { useCallback, useRef } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const fallbackRef = useRef(false)

  const getToken = useCallback(async (action = 'submit') => {
    if (executeRecaptcha) {
      try {
        return await executeRecaptcha(action)
      } catch {
        return null
      }
    }
    // Fallback: generate a timestamp-based token
    if (!fallbackRef.current) {
      fallbackRef.current = true
    }
    return `recaptcha_fallback_${Date.now()}`
  }, [executeRecaptcha])

  return { getToken }
}

export { RECAPTCHA_SITE_KEY }
