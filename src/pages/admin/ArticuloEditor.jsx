import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'

export default function ArticuloEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', articleSection: '', category: '',
    description: '', content: '', status: 'draft', is_featured: false,
    keywords: '', featured_image: '', author_name: 'Mirella Bartra',
    published_at: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (id) {
      db.getAllArticles().then(({ data }) => {
        const article = (data || []).find(a => String(a.id) === String(id))
        if (article) setForm(prev => ({ ...prev, ...article }))
      })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, is_featured: form.is_featured === true || form.is_featured === 'true' }
    const { error } = isEdit
      ? await db.updateArticle(id, payload)
      : await db.createArticle(payload)
    setSaving(false)
    if (error) { alert('Error al guardar') } else { navigate('/admin/articulos') }
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <>
      <Helmet><title>{isEdit ? 'Editar' : 'Nuevo'} Artículo | Mirella Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '20px' }}>{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '800px', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Título *" value={form.title} onChange={update('title')} required />
          <input className="input-brutalist" placeholder="Slug *" value={form.slug} onChange={update('slug')} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Sección (ej. Noticias, Investigación)" value={form.articleSection} onChange={update('articleSection')} />
          <input className="input-brutalist" placeholder="Categoría" value={form.category} onChange={update('category')} />
        </div>
        <textarea className="input-brutalist" placeholder="Descripción" value={form.description} onChange={update('description')} rows={3} />
        <textarea className="input-brutalist" placeholder="Contenido (HTML) *" value={form.content} onChange={update('content')} rows={15} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
          <select className="input-brutalist" value={form.status} onChange={update('status')}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
          <input className="input-brutalist" placeholder="Palabras clave (separadas por coma)" value={form.keywords} onChange={update('keywords')} />
          <input className="input-brutalist" type="date" value={form.published_at?.slice(0, 10)} onChange={update('published_at')} />
        </div>
        <input className="input-brutalist" placeholder="URL de imagen destacada" value={form.featured_image} onChange={update('featured_image')} />
        <input className="input-brutalist" placeholder="Autor" value={form.author_name} onChange={update('author_name')} />
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} />
          Destacado
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-accent btn-small" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" className="btn-outline btn-small" onClick={() => navigate('/admin/articulos')}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
