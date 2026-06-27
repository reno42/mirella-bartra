import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Subscribers() {
  const [subs, setSubs] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { db.getAllSubscribers().then(({ data }) => setSubs(data || [])).finally(() => setLoading(false)) }, [])
  return (
    <>
      <Helmet><title>Suscriptores | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>Suscriptores ({subs.length})</h1>
      {loading ? <LoadingSpinner /> : subs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay suscriptores.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activo</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</th>
            </tr></thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{s.email}</td>
                  <td style={{ padding: '8px' }}>{s.name || '-'}</td>
                  <td style={{ padding: '8px' }}>{s.is_active ? '✅' : '❌'}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{formatDate(s.subscribed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
