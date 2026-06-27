import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Leads() {
  const [leads, setLeads] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { db.getAllLeads().then(({ data }) => setLeads(data || [])).finally(() => setLoading(false)) }, [])
  return (
    <>
      <Helmet><title>Leads | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>Leads ({leads.length})</h1>
      {loading ? <LoadingSpinner /> : leads.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay leads.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origen</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</th>
            </tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{l.name}</td>
                  <td style={{ padding: '8px' }}>{l.email}</td>
                  <td style={{ padding: '8px' }}><span className="tag tag-outline" style={{ fontSize: '9px' }}>{l.source}</span></td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
