import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Directorio() {
  const [entries, setEntries] = useState([]); const [loading, setLoading] = useState(true)
  const fetch = () => { setLoading(true); db.getAllDirectory().then(({ data }) => setEntries(data || [])).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])
  const handleDelete = async (id) => { if (!confirm('¿Eliminar?')) return; await db.deleteDirectoryEntry(id); fetch() }
  return (
    <>
      <Helmet><title>Directorio | Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Directorio</h1>
        <Link to="/admin/directorio/nuevo" className="btn-accent btn-small">+ Nuevo perfil</Link>
      </div>
      {loading ? <LoadingSpinner /> : entries.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay entradas.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Especialidad</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ciudad</th>
              <th style={{ padding: '8px' }}>Acciones</th>
            </tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{e.full_name}</td>
                  <td style={{ padding: '8px' }}>{e.specialty || '-'}</td>
                  <td style={{ padding: '8px' }}>{e.city || '-'}</td>
                  <td style={{ padding: '8px', display: 'flex', gap: '6px' }}>
                    <Link to={`/admin/directorio/editar/${e.id}`} className="btn-outline btn-small">Editar</Link>
                    <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(e.id)}>X</button>
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
