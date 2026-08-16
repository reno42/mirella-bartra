import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Eventos() {
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [showAddForm, setShowAddForm] = useState(null)
  const [newReg, setNewReg] = useState({ full_name: '', email: '', phone: '', profession: '' })
  const [toast, setToast] = useState(null)

  const fetch = () => {
    setLoading(true)
    Promise.all([
      db.getAllEvents(),
      db.getAllEventRegistrations(),
    ]).then(([eventsRes, regsRes]) => {
      setEvents(eventsRes.data || [])
      setRegistrations(regsRes.data || [])
    }).catch(err => {
      // event_registrations table may not exist yet (SQL 06 pending)
      if (err?.message?.includes('event_registrations') || err?.code === '42P01') {
        db.getAllEvents().then(({ data }) => setEvents(data || []))
      }
    }).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar evento?')) return
    await db.deleteEvent(id)
    fetch()
  }

  const handleAddRegistrant = async (eventId) => {
    if (!newReg.full_name.trim() || !newReg.email.trim()) {
      showToast('Nombre y email son obligatorios', 'error')
      return
    }
    const { error } = await db.createEventRegistration({
      event_id: eventId,
      full_name: newReg.full_name.trim(),
      email: newReg.email.trim(),
      phone: newReg.phone || null,
      profession: newReg.profession || null,
      registration_status: 'confirmed',
      payment_status: 'free',
    })
    if (error) showToast('Error: ' + error.message, 'error')
    else {
      showToast('Inscrito agregado')
      setNewReg({ full_name: '', email: '', phone: '', profession: '' })
      setShowAddForm(null)
      fetch()
    }
  }

  const handleStatusChange = async (regId, newStatus) => {
    const { error } = await db.updateEventRegistration(regId, { registration_status: newStatus })
    if (error) showToast('Error: ' + error.message, 'error')
    else {
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, registration_status: newStatus } : r))
    }
  }

  const statusMap = { upcoming: { c: 'tag', t: 'Próximo' }, ongoing: { c: 'tag', t: 'En vivo' }, finished: { c: 'tag tag-outline', t: 'Finalizado' } }
  const regStatusMap = {
    pending: '⏳ Pendiente',
    confirmed: '✅ Confirmado',
    attended: '🎓 Asistió',
    cancelled: '❌ Cancelado',
    no_show: '🚫 No show',
  }

  const regsFor = (eventId) => registrations.filter(r => r.event_id === eventId)

  return (
    <>
      <Helmet><title>Eventos | Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Eventos <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({events.length})</span></h1>
        <Link to="/admin/eventos/nuevo" className="btn-accent btn-small">+ Nuevo evento</Link>
      </div>

      {loading ? <LoadingSpinner /> : events.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay eventos.</p> : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {events.map(e => {
            const s = statusMap[e.event_status] || statusMap.upcoming
            const regs = regsFor(e.id)
            const isExpanded = expandedEvent === e.id
            return (
              <div key={e.id} className="card-brutalist" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Event row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '14px 16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{e.title || e.name}</span>
                      <span className={s.c} style={{ fontSize: '9px' }}>{s.t}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📅 {formatDate(e.start_date)} {e.city ? `· 📍 ${e.city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-outline btn-small"
                      onClick={() => { setExpandedEvent(isExpanded ? null : e.id); setShowAddForm(null) }}
                    >
                      👥 Inscritos ({regs.length})
                    </button>
                    <Link to={`/admin/eventos/editar/${e.id}`} className="btn-outline btn-small">Editar</Link>
                    <Link to="/admin/certificados" className="btn-outline btn-small">🎓</Link>
                    <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(e.id)}>X</button>
                  </div>
                </div>

                {/* Registrants panel */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px', background: 'var(--bg-base)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                        Inscritos — {e.title || e.name}
                      </h4>
                      <button className="btn-accent btn-small" onClick={() => setShowAddForm(showAddForm === e.id ? null : e.id)}>
                        {showAddForm === e.id ? 'Cerrar' : '+ Agregar inscrito'}
                      </button>
                    </div>

                    {/* Add form */}
                    {showAddForm === e.id && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', padding: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '12px' }}>
                        <input className="input-brutalist" placeholder="Nombre completo *" value={newReg.full_name} onChange={ev => setNewReg(p => ({ ...p, full_name: ev.target.value }))} />
                        <input className="input-brutalist" type="email" placeholder="Email *" value={newReg.email} onChange={ev => setNewReg(p => ({ ...p, email: ev.target.value }))} />
                        <input className="input-brutalist" placeholder="Teléfono" value={newReg.phone} onChange={ev => setNewReg(p => ({ ...p, phone: ev.target.value }))} />
                        <input className="input-brutalist" placeholder="Profesión" value={newReg.profession} onChange={ev => setNewReg(p => ({ ...p, profession: ev.target.value }))} />
                        <button className="btn-primary btn-small" onClick={() => handleAddRegistrant(e.id)} style={{ justifySelf: 'start' }}>Guardar</button>
                      </div>
                    )}

                    {regs.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin inscritos todavía. Agrégalos manualmente o comparte el evento.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={thStyle}>Nombre</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Profesión</th>
                            <th style={thStyle}>Pago</th>
                            <th style={thStyle}>Estado</th>
                          </tr></thead>
                          <tbody>
                            {regs.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: 600 }}>{r.full_name}</td>
                                <td style={{ padding: '8px' }}>{r.email}</td>
                                <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{r.profession || '-'}</td>
                                <td style={{ padding: '8px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: r.payment_status === 'paid' ? '#0d9488' : 'var(--text-muted)' }}>
                                    {r.payment_status === 'paid' ? '💰 Pagado' : r.payment_status === 'free' ? 'Gratis' : '⏳ ' + r.payment_status}
                                  </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <select
                                    className="input-brutalist"
                                    value={r.registration_status}
                                    onChange={ev => handleStatusChange(r.id, ev.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '11px', width: 'auto' }}
                                  >
                                    {Object.entries(regStatusMap).map(([val, label]) => (
                                      <option key={val} value={val}>{label}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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

const thStyle = {
  padding: '8px',
  textAlign: 'left',
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
}
