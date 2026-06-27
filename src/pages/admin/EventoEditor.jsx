import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'

export default function EventoEditor() {
  const { id } = useParams(); const navigate = useNavigate(); const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', content: '', event_status: 'upcoming', start_date: '', end_date: '', location: '', location_url: '', price: 0, featured_image: '' })
  useEffect(() => { if (id) db.getAllEvents().then(({ data }) => { const e = (data || []).find(x => String(x.id) === String(id)); if (e) setForm(p => ({ ...p, ...e })) }) }, [id])
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); const p = { ...form, price: parseFloat(form.price) || 0 }; const { error } = isEdit ? await db.updateEvent(id, p) : await db.createEvent(p); setSaving(false); if (error) alert('Error'); else navigate('/admin/eventos') }
  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  return (
    <>
      <Helmet><title>{isEdit ? 'Editar' : 'Nuevo'} Evento | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '20px' }}>{isEdit ? 'Editar evento' : 'Nuevo evento'}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Título *" value={form.title} onChange={u('title')} required />
          <input className="input-brutalist" placeholder="Slug *" value={form.slug} onChange={u('slug')} required />
        </div>
        <textarea className="input-brutalist" placeholder="Descripción" value={form.description} onChange={u('description')} rows={2} />
        <textarea className="input-brutalist" placeholder="Contenido (HTML)" value={form.content} onChange={u('content')} rows={10} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <select className="input-brutalist" value={form.event_status} onChange={u('event_status')}>
            <option value="upcoming">Próximo</option><option value="ongoing">En vivo</option><option value="finished">Finalizado</option>
          </select>
          <input className="input-brutalist" type="date" value={form.start_date?.slice(0,10)} onChange={u('start_date')} />
          <input className="input-brutalist" type="date" value={form.end_date?.slice(0,10)} onChange={u('end_date')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Lugar (presencial)" value={form.location} onChange={u('location')} />
          <input className="input-brutalist" placeholder="URL (virtual)" value={form.location_url} onChange={u('location_url')} />
        </div>
        <input className="input-brutalist" type="number" placeholder="Precio (S/)" value={form.price} onChange={u('price')} min="0" />
        <input className="input-brutalist" placeholder="URL de imagen" value={form.featured_image} onChange={u('featured_image')} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-accent btn-small" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn-outline btn-small" onClick={() => navigate('/admin/eventos')}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
