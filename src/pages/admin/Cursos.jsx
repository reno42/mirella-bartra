import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Cursos() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = () => { setLoading(true); db.getAllCourses().then(({ data }) => setCourses(data || [])).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este curso?')) return
    await db.deleteCourse(id); fetch()
  }

  return (
    <>
      <Helmet><title>Cursos | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Cursos</h1>
        <Link to="/admin/cursos/nuevo" className="btn-accent btn-small">+ Nuevo curso</Link>
      </div>
      {loading ? <LoadingSpinner /> : courses.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay cursos.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Título</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modalidad</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inicio</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Precio</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Acciones</th>
            </tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{c.title}</td>
                  <td style={{ padding: '8px' }}>{c.modality || '-'}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{formatDate(c.start_date)}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>S/ {c.price || 0}</td>
                  <td style={{ padding: '8px', display: 'flex', gap: '6px' }}>
                    <Link to={`/admin/cursos/editar/${c.id}`} className="btn-outline btn-small">Editar</Link>
                    <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
