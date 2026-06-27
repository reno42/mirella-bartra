import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

/**
 * Deposits — Manual payment tracking.
 * Per acotaciones: no payment gateway.
 * User deposits to bank account, uploads:
 *   - transaction code
 *   - first name + last name
 *   - amount
 *   - screenshot (captura)
 * Admins manually verify and approve.
 */

export default function Deposits() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all') // all | pending | approved | rejected
  const [toast, setToast] = useState(null)

  const fetch = () => {
    setLoading(true)
    supabase.from('deposits').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setDeposits(data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleStatus = async (id, newStatus) => {
    const { error } = await supabase.from('deposits').update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) showToast('Error al actualizar', 'error')
    else { showToast(`Depósito ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`); fetch() }
  }

  const getStatusTag = (status) => {
    const map = {
      pending: { cls: 'tag', txt: 'Pendiente', style: { background: '#f59e0b' } },
      approved: { cls: 'tag', txt: 'Aprobado', style: { background: '#059669' } },
      rejected: { cls: 'tag', txt: 'Rechazado', style: { background: '#ef4444' } },
    }
    const s = map[status] || map.pending
    return <span className={s.cls} style={{ fontSize: '9px', ...s.style }}>{s.txt}</span>
  }

  const filtered = filter === 'all' ? deposits : deposits.filter(d => d.status === filter)

  return (
    <>
      <Helmet><title>Depósitos | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Depósitos ({deposits.length})</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={filter === f ? 'btn-primary btn-small' : 'btn-outline btn-small'}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobados' : 'Rechazados'}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="card-brutalist" style={{ padding: '12px 16px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-dark)' }}>ℹ️ Sistema de depósito manual:</strong> Los usuarios depositan en la cuenta bancaria y suben su código de transacción, nombres, apellidos, monto y captura de pantalla. El admin revisa y aprueba/rechaza manualmente. No hay pasarela de pago automática.
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay depósitos{filter !== 'all' ? ` ${filter}` : ''}.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Código Trans.</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Nombre</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Monto</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Concepto</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Fecha</th>
                <th style={{ padding: '10px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.transaction_code || '-'}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                    {d.first_name} {d.last_name}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {d.currency || 'S/'} {parseFloat(d.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className="tag tag-outline" style={{ fontSize: '9px' }}>{d.concept || d.reference || 'Depósito'}</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{getStatusTag(d.status)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.created_at)}</td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className="btn-outline btn-small" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                      {expanded === d.id ? 'Ocultar' : 'Ver'}
                    </button>
                    {d.status === 'pending' && (
                      <>
                        <button className="btn-outline btn-small" onClick={() => handleStatus(d.id, 'approved')} style={{ borderColor: 'var(--accent-glow)', color: '#059669' }}>Aprobar</button>
                        <button className="btn-outline btn-small" onClick={() => handleStatus(d.id, 'rejected')} style={{ borderColor: '#fca5a5', color: '#ef4444' }}>Rechazar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded detail */}
          {expanded && (() => {
            const d = deposits.find(x => x.id === expanded)
            if (!d) return null
            return (
              <div className="card-brutalist" style={{ padding: '16px', marginTop: '12px', display: 'grid', gap: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700 }}>Detalle del Depósito</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div><strong>Nombre:</strong> {d.first_name} {d.last_name}</div>
                  <div><strong>Email:</strong> {d.email || '-'}</div>
                  <div><strong>Teléfono:</strong> {d.phone || '-'}</div>
                  <div><strong>Código Transacción:</strong> <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '3px' }}>{d.transaction_code}</code></div>
                  <div><strong>Monto:</strong> {d.currency || 'S/'} {parseFloat(d.amount).toFixed(2)}</div>
                  <div><strong>Concepto:</strong> {d.concept || d.reference || '-'}</div>
                  <div><strong>Banco:</strong> {d.bank || '-'}</div>
                  <div><strong>Fecha envío:</strong> {formatDate(d.created_at)}</div>
                  {d.reviewed_at && <div><strong>Revisado:</strong> {formatDate(d.reviewed_at)}</div>}
                </div>

                {/* Screenshot */}
                {d.screenshot_url && (
                  <div>
                    <strong style={{ fontSize: '12px' }}>Captura de pantalla:</strong>
                    <div style={{ marginTop: '8px' }}>
                      <a href={d.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={d.screenshot_url}
                          alt="Comprobante de depósito"
                          style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </a>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {d.notes && (
                  <div>
                    <strong style={{ fontSize: '12px' }}>Notas del usuario:</strong>
                    <div className="card-brutalist" style={{ padding: '10px 12px', marginTop: '4px', background: 'var(--bg-base)', fontSize: '12px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {d.notes}
                    </div>
                  </div>
                )}

                {d.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn-primary btn-small" onClick={() => handleStatus(d.id, 'approved')} style={{ background: '#059669', borderColor: '#059669' }}>✅ Aprobar depósito</button>
                    <button className="btn-outline btn-small" onClick={() => handleStatus(d.id, 'rejected')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>❌ Rechazar depósito</button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
