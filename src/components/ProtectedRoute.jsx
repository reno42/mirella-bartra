import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    auth.getSession().then(({ session }) => {
      setAuthed(!!session)
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
