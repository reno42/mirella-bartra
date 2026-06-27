import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { users } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Users() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    users.getAll().then(({ data }) => setProfiles(data || [])).finally(() => setLoading(false))
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await users.updateRole(userId, newRole)
    if (error) showToast('Error al actualizar rol', 'error')
    else {
      showToast('Rol actualizado')
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
    }
  }

  const getRoleBadge = (role) => {
    const map = {
      admin: { cls: 'tag', txt: 'Admin', style: { background: '#111' } },
      editor: { cls: 'tag', txt: 'Editor', style: { background: '#6366f1' } },
      therapist: { cls: 'tag tag-outline', txt: 'Terapeuta' },
      user: { cls: 'tag tag-outline', txt: 'Usuario' },
    }
    const s = map[role] || map.user
    return <span className={s.cls} style={{ fontSize: '9px', ...s.style }}>{s.txt}</span>
  }

  return (
    <>
      <Helmet><title>Usuarios | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Usuarios ({profiles.length})</h1>
      </div>

      {loading ? <LoadingSpinner /> : profiles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay usuarios registrados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Nombre</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Rol</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Registro</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Cambiar Rol</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{p.email || p.id}</td>
                  <td style={{ padding: '10px 8px' }}>
                    {[p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || '-'}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{getRoleBadge(p.role)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select
                      className="input-brutalist"
                      value={p.role || 'user'}
                      onChange={(e) => handleRoleChange(p.id, e.target.value)}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="therapist">Terapeuta</option>
                      <option value="user">Usuario</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
