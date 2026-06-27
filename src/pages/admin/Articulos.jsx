import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Articulos() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = () => {
    setLoading(true)
    db.getAllArticles().then(({ data }) => setArticles(data || []))
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchArticles() }, [])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este artículo?')) return
    const { error } = await db.deleteArticle(id)
    if (error) { alert('Error al eliminar') } else { fetchArticles() }
  }

  const getStatusTag = (status) => {
    const map = { published: { cls: 'tag', txt: 'Publicado' }, draft: { cls: 'tag tag-outline', txt: 'Borrador' }, archived: { cls: 'tag tag-outline', txt: 'Archivado' } }
    const s = map[status] || map.draft
    return <span className={s.cls} style={{ fontSize: '9px' }}>{s.txt}</span>
  }

  return (
    <>
      <Helmet><title>Artículos | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Artículos</h1>
        <Link to="/admin/articulos/nuevo" className="btn-accent btn-small">+ Nuevo artículo</Link>
      </div>

      {loading ? <LoadingSpinner /> : articles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay artículos. Crea el primero.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Título</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Fecha</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{a.title}</td>
                  <td style={{ padding: '10px 8px' }}>{getStatusTag(a.status)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{formatDate(a.published_at || a.created_at)}</td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: '6px' }}>
                    <Link to={`/admin/articulos/editar/${a.id}`} className="btn-outline btn-small">Editar</Link>
                    <button className="btn-outline btn-small" onClick={() => handleDelete(a.id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>Eliminar</button>
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
