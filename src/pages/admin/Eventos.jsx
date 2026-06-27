import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Eventos() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const fetch = () => { setLoading(true); db.getAllEvents().then(({ data }) => setEvents(data || [])).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])
  const handleDelete = async (id) => { if (!confirm('¿Eliminar?')) return; await db.deleteEvent(id); fetch() }
  const statusMap = { upcoming: { c: 'tag', t: 'Próximo' }, ongoing: { c: 'tag', t: 'En vivo' }, finished: { c: 'tag tag-outline', t: 'Finalizado' } }

  return (
    <>
      <Helmet><title>Eventos | Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Eventos</h1>
        <Link to="/admin/eventos/nuevo" className="btn-accent btn-small">+ Nuevo evento</Link>
      </div>
      {loading ? <LoadingSpinner /> : events.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay eventos.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Título</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '8px' }}>Acciones</th>
            </tr></thead>
            <tbody>
              {events.map(e => { const s = statusMap[e.event_status] || statusMap.upcoming; return (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{e.title}</td>
                  <td style={{ padding: '8px' }}><span className={s.c} style={{ fontSize: '9px' }}>{s.t}</span></td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{formatDate(e.start_date)}</td>
                  <td style={{ padding: '8px', display: 'flex', gap: '6px' }}>
                    <Link to={`/admin/eventos/editar/${e.id}`} className="btn-outline btn-small">Editar</Link>
                    <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(e.id)}>X</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
