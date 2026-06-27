import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'

export default function CursoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', content: '', modality: 'virtual', status: 'published', price: 0, certificate: true, start_date: '', end_date: '', duration: '', featured_image: '' })

  useEffect(() => {
    if (id) db.getAllCourses().then(({ data }) => { const c = (data || []).find(x => String(x.id) === String(id)); if (c) setForm(p => ({ ...p, ...c })) })
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, price: parseFloat(form.price) || 0 }
    const { error } = isEdit ? await db.updateCourse(id, payload) : await db.createCourse(payload)
    setSaving(false)
    if (error) alert('Error al guardar'); else navigate('/admin/cursos')
  }

  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <>
      <Helmet><title>{isEdit ? 'Editar' : 'Nuevo'} Curso | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '20px' }}>{isEdit ? 'Editar curso' : 'Nuevo curso'}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Título *" value={form.title} onChange={u('title')} required />
          <input className="input-brutalist" placeholder="Slug *" value={form.slug} onChange={u('slug')} required />
        </div>
        <textarea className="input-brutalist" placeholder="Descripción" value={form.description} onChange={u('description')} rows={2} />
        <textarea className="input-brutalist" placeholder="Contenido (HTML)" value={form.content} onChange={u('content')} rows={10} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <select className="input-brutalist" value={form.modality} onChange={u('modality')}>
            <option value="virtual">Virtual</option><option value="presencial">Presencial</option><option value="hybrid">Híbrido</option>
          </select>
          <select className="input-brutalist" value={form.status} onChange={u('status')}>
            <option value="published">Publicado</option><option value="draft">Borrador</option>
          </select>
          <input className="input-brutalist" type="number" placeholder="Precio (S/)" value={form.price} onChange={u('price')} min="0" step="0.01" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" type="date" value={form.start_date?.slice(0,10)} onChange={u('start_date')} placeholder="Fecha inicio" />
          <input className="input-brutalist" type="date" value={form.end_date?.slice(0,10)} onChange={u('end_date')} placeholder="Fecha fin" />
          <input className="input-brutalist" placeholder="Duración" value={form.duration} onChange={u('duration')} />
        </div>
        <input className="input-brutalist" placeholder="URL de imagen" value={form.featured_image} onChange={u('featured_image')} />
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={form.certificate} onChange={e => setForm(p => ({ ...p, certificate: e.target.checked }))} /> Incluye certificado
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-accent btn-small" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn-outline btn-small" onClick={() => navigate('/admin/cursos')}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
