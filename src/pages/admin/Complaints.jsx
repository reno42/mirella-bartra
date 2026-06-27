import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const fetch = () => {
    setLoading(true)
    db.getAllComplaints().then(({ data }) => setComplaints(data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const handleStatus = async (id, newStatus) => {
    await db.updateComplaint(id, { status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null })
    fetch()
  }

  const getStatusTag = (status) => {
    const map = {
      nuevo: { cls: 'tag', txt: 'Nuevo', style: { background: '#ef4444' } },
      en_proceso: { cls: 'tag tag-outline', txt: 'En Proceso', style: { borderColor: '#f59e0b', color: '#d97706' } },
      resolved: { cls: 'tag tag-outline', txt: 'Resuelto', style: { borderColor: 'var(--accent-glow)', color: '#059669' } },
    }
    const s = map[status] || map.nuevo
    return <span className={s.cls} style={{ fontSize: '9px', ...s.style }}>{s.txt}</span>
  }

  return (
    <>
      <Helmet><title>Reclamos | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Reclamos ({complaints.length})</h1>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay reclamos registrados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Cliente</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Tipo</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Fecha</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{c.full_name || c.name || 'Anónimo'}</td>
                  <td style={{ padding: '10px 8px' }}>{c.email || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className="tag tag-outline" style={{ fontSize: '9px' }}>{c.complaint_type || c.type || 'Reclamo'}</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{getStatusTag(c.status)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className="btn-outline btn-small" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                      {expanded === c.id ? 'Ocultar' : 'Ver'}
                    </button>
                    {c.status !== 'en_proceso' && (
                      <button className="btn-outline btn-small" onClick={() => handleStatus(c.id, 'en_proceso')} style={{ borderColor: '#f59e0b', color: '#d97706' }}>En Proceso</button>
                    )}
                    {c.status !== 'resolved' && (
                      <button className="btn-outline btn-small" onClick={() => handleStatus(c.id, 'resolved')} style={{ borderColor: 'var(--accent-glow)', color: '#059669' }}>Resolver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded Detail */}
          {expanded && (() => {
            const c = complaints.find(x => x.id === expanded)
            if (!c) return null
            return (
              <div className="card-brutalist" style={{ padding: '16px', marginTop: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Detalle del Reclamo</h3>
                <div style={{ display: 'grid', gap: '8px', fontSize: '12px' }}>
                  {c.full_name && <div><strong>Nombre:</strong> {c.full_name}</div>}
                  {c.document_type && <div><strong>Documento:</strong> {c.document_type} — {c.document_number}</div>}
                  {c.email && <div><strong>Email:</strong> {c.email}</div>}
                  {c.phone && <div><strong>Teléfono:</strong> {c.phone}</div>}
                  <div><strong>Descripción:</strong></div>
                  <div className="card-brutalist" style={{ padding: '12px', background: 'var(--bg-base)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {c.description || c.message || c.details || 'Sin descripción.'}
                  </div>
                  {c.resolved_at && <div style={{ color: '#059669', fontSize: '11px' }}>✅ Resuelto el {formatDate(c.resolved_at)}</div>}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </>
  )
}
