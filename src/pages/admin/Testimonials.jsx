import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const INITIAL_FORM = { author_name: '', author_title: '', quote: '', stars: 5, status: 'pending' }

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)

  const fetch = () => {
    setLoading(true)
    db.getAllTestimonials().then(({ data }) => setItems(data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este testimonio?')) return
    await db.deleteTestimonial(id)
    fetch()
  }

  const handleApprove = async (id) => {
    await db.updateTestimonial(id, { status: 'published' })
    fetch()
  }

  const handleReject = async (id) => {
    await db.updateTestimonial(id, { status: 'rejected' })
    fetch()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await db.updateTestimonial(editingId, form)
      if (error) { alert('Error al actualizar'); return }
      setEditingId(null)
    } else {
      const { error } = await db.createTestimonial(form)
      if (error) { alert('Error al crear'); return }
    }
    setForm(INITIAL_FORM)
    fetch()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({ author_name: item.author_name, author_title: item.author_title || '', quote: item.quote, stars: item.stars || 5, status: item.status })
  }

  const cancelEdit = () => { setEditingId(null); setForm(INITIAL_FORM) }

  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const getStatusTag = (status) => {
    const map = {
      published: { cls: 'tag', txt: '✅ Aprobado' },
      pending: { cls: 'tag tag-outline', txt: '⏳ Pendiente' },
      rejected: { cls: 'tag tag-outline', txt: '❌ Rechazado', style: { borderColor: '#ef4444', color: '#ef4444' } },
    }
    const s = map[status] || map.pending
    return <span className={s.cls} style={{ fontSize: '9px', ...s.style }}>{s.txt}</span>
  }

  return (
    <>
      <Helmet><title>Testimonios | Mirella Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>Testimonios</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '16px', marginBottom: '24px', display: 'grid', gap: '10px', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700 }}>{editingId ? 'Editar Testimonio' : 'Nuevo Testimonio'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input className="input-brutalist" placeholder="Nombre *" value={form.author_name} onChange={u('author_name')} required />
          <input className="input-brutalist" placeholder="Cargo / Profesión" value={form.author_title} onChange={u('author_title')} />
        </div>
        <textarea className="input-brutalist" placeholder="Testimonio *" value={form.quote} onChange={u('quote')} rows={3} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <select className="input-brutalist" value={form.stars} onChange={e => setForm(p => ({ ...p, stars: Number(e.target.value) }))}>
            <option value={5}>★★★★★ (5)</option>
            <option value={4}>★★★★☆ (4)</option>
            <option value={3}>★★★☆☆ (3)</option>
            <option value={2}>★★☆☆☆ (2)</option>
            <option value={1}>★☆☆☆☆ (1)</option>
          </select>
          <select className="input-brutalist" value={form.status} onChange={u('status')}>
            <option value="pending">Pendiente</option>
            <option value="published">Publicado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-accent btn-small">{editingId ? 'Actualizar' : 'Crear Testimonio'}</button>
          {editingId && <button type="button" className="btn-outline btn-small" onClick={cancelEdit}>Cancelar</button>}
        </div>
      </form>

      {/* List */}
      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay testimonios aún.</p>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {items.map(t => (
            <div key={t.id} className="card-brutalist" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.author_name}</span>
                    {getStatusTag(t.status)}
                  </div>
                  {t.author_title && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.author_title}</div>}
                  <div style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: '4px' }}>{t.quote?.slice(0, 150)}{t.quote?.length > 150 ? '...' : ''}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{'★'.repeat(t.stars || 5)}{'☆'.repeat(5 - (t.stars || 5))} · {formatDate(t.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {t.status !== 'published' && (
                    <button className="btn-outline btn-small" onClick={() => handleApprove(t.id)} style={{ borderColor: 'var(--accent-glow)', color: '#059669' }}>Aprobar</button>
                  )}
                  {t.status !== 'rejected' && (
                    <button className="btn-outline btn-small" onClick={() => handleReject(t.id)} style={{ borderColor: '#fca5a5', color: '#ef4444' }}>Rechazar</button>
                  )}
                  <button className="btn-outline btn-small" onClick={() => startEdit(t)}>Editar</button>
                  <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(t.id)}>X</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
