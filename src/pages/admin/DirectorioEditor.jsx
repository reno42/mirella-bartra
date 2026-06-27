import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'

export default function DirectorioEditor() {
  const { id } = useParams(); const navigate = useNavigate(); const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', slug: '', email: '', phone: '', specialty: '', city: '', years_experience: 0, bio: '', status: 'pending', consent_given: true })
  useEffect(() => { if (id) db.getAllDirectory().then(({ data }) => { const e = (data || []).find(x => String(x.id) === String(id)); if (e) setForm(p => ({ ...p, ...e })) }) }, [id])
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); const p = { ...form, years_experience: parseInt(form.years_experience) || 0 }; const { error } = isEdit ? await db.updateDirectoryEntry(id, p) : await db.createDirectoryEntry(p); setSaving(false); if (error) alert('Error'); else navigate('/admin/directorio') }
  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  return (
    <>
      <Helmet><title>{isEdit ? 'Editar' : 'Nuevo'} Perfil | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '20px' }}>{isEdit ? 'Editar perfil' : 'Nuevo perfil'}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Nombre *" value={form.full_name} onChange={u('full_name')} required />
          <input className="input-brutalist" placeholder="Slug *" value={form.slug} onChange={u('slug')} required />
        </div>
        <input className="input-brutalist" type="email" placeholder="Email" value={form.email} onChange={u('email')} />
        <input className="input-brutalist" placeholder="Teléfono" value={form.phone} onChange={u('phone')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input className="input-brutalist" placeholder="Especialidad" value={form.specialty} onChange={u('specialty')} />
          <input className="input-brutalist" placeholder="Ciudad" value={form.city} onChange={u('city')} />
          <input className="input-brutalist" type="number" placeholder="Años exp." value={form.years_experience} onChange={u('years_experience')} />
        </div>
        <textarea className="input-brutalist" placeholder="Biografía" value={form.bio} onChange={u('bio')} rows={4} />
        <select className="input-brutalist" value={form.status} onChange={u('status')}>
          <option value="published">Publicado</option><option value="pending">Pendiente</option><option value="rejected">Rechazado</option>
        </select>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-accent btn-small" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn-outline btn-small" onClick={() => navigate('/admin/directorio')}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
