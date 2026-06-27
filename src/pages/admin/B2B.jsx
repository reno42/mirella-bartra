import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

/**
 * B2B — Corporate training programs management.
 * Separate page for B2B Capacitaciones (per acotaciones).
 */

const INITIAL_FORM = {
  title: '',
  slug: '',
  description: '',
  content: '',
  target_audience: '',
  duration: '',
  modality: 'presencial',
  price_info: '',
  benefits: '',
  status: 'draft',
  image_url: '',
  cta_text: 'Solicitar cotización',
  cta_url: '',
  featured: false,
}

export default function B2B() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [leads, setLeads] = useState([])
  const [view, setView] = useState('programs') // programs | leads

  const fetch = () => {
    setLoading(true)
    supabase.from('b2b_programs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []))
      .finally(() => setLoading(false))
  }

  const fetchLeads = () => {
    supabase.from('b2b_leads').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setLeads(data || []))
  }

  useEffect(() => { fetch(); fetchLeads() }, [])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este programa B2B?')) return
    await supabase.from('b2b_programs').delete().eq('id', id)
    fetch()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
    if (editingId) {
      const { error } = await supabase.from('b2b_programs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId)
      if (error) { alert('Error al actualizar'); return }
      setEditingId(null)
    } else {
      const { error } = await supabase.from('b2b_programs').insert(payload)
      if (error) { alert('Error al crear'); return }
    }
    setForm(INITIAL_FORM)
    fetch()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title, slug: item.slug || '', description: item.description || '',
      content: item.content || '', target_audience: item.target_audience || '',
      duration: item.duration || '', modality: item.modality || 'presencial',
      price_info: item.price_info || '', benefits: item.benefits || '',
      status: item.status || 'draft', image_url: item.image_url || '',
      cta_text: item.cta_text || 'Solicitar cotización', cta_url: item.cta_url || '',
      featured: item.featured || false,
    })
  }

  const cancelEdit = () => { setEditingId(null); setForm(INITIAL_FORM) }
  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const getStatusTag = (status) => {
    const map = {
      published: { cls: 'tag', txt: 'Publicado' },
      draft: { cls: 'tag tag-outline', txt: 'Borrador' },
      archived: { cls: 'tag tag-outline', txt: 'Archivado' },
    }
    const s = map[status] || map.draft
    return <span className={s.cls} style={{ fontSize: '9px' }}>{s.txt}</span>
  }

  return (
    <>
      <Helmet><title>B2B | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Capacitaciones B2B</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={view === 'programs' ? 'btn-primary btn-small' : 'btn-outline btn-small'} onClick={() => setView('programs')}>
            Programas ({items.length})
          </button>
          <button className={view === 'leads' ? 'btn-primary btn-small' : 'btn-outline btn-small'} onClick={() => setView('leads')}>
            Leads B2B ({leads.length})
          </button>
        </div>
      </div>

      {view === 'leads' ? (
        /* ── B2B Leads View ── */
        <>
          {leads.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay leads B2B aún.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Empresa</th>
                    <th style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contacto</th>
                    <th style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Programa</th>
                    <th style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{l.company_name || '-'}</td>
                      <td style={{ padding: '8px' }}>{l.contact_name || '-'}</td>
                      <td style={{ padding: '8px' }}>{l.email}</td>
                      <td style={{ padding: '8px' }}><span className="tag tag-outline" style={{ fontSize: '9px' }}>{l.program || '-'}</span></td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* ── Programs View ── */
        <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '16px', marginBottom: '24px', display: 'grid', gap: '10px', maxWidth: '700px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700 }}>{editingId ? 'Editar Programa B2B' : 'Nuevo Programa B2B'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input className="input-brutalist" placeholder="Título *" value={form.title} onChange={u('title')} required />
              <input className="input-brutalist" placeholder="Slug (auto-generado)" value={form.slug} onChange={u('slug')} />
            </div>
            <textarea className="input-brutalist" placeholder="Descripción corta" value={form.description} onChange={u('description')} rows={2} />
            <textarea className="input-brutalist" placeholder="Contenido completo (HTML)" value={form.content} onChange={u('content')} rows={4} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input className="input-brutalist" placeholder="Audiencia objetivo" value={form.target_audience} onChange={u('target_audience')} />
              <input className="input-brutalist" placeholder="Duración (ej. 8 horas)" value={form.duration} onChange={u('duration')} />
              <select className="input-brutalist" value={form.modality} onChange={u('modality')}>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input className="input-brutalist" placeholder="Info de precio (ej. Desde S/500 por persona)" value={form.price_info} onChange={u('price_info')} />
              <input className="input-brutalist" placeholder="URL de imagen" value={form.image_url} onChange={u('image_url')} />
            </div>
            <textarea className="input-brutalist" placeholder="Beneficios (uno por línea)" value={form.benefits} onChange={u('benefits')} rows={3} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <input className="input-brutalist" placeholder="Texto CTA" value={form.cta_text} onChange={u('cta_text')} />
              <input className="input-brutalist" placeholder="URL CTA" value={form.cta_url} onChange={u('cta_url')} />
              <select className="input-brutalist" value={form.status} onChange={u('status')}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={form.featured} onChange={u('featured')} /> Destacado
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-accent btn-small">{editingId ? 'Actualizar' : 'Crear Programa'}</button>
              {editingId && <button type="button" className="btn-outline btn-small" onClick={cancelEdit}>Cancelar</button>}
            </div>
          </form>

          {/* List */}
          {loading ? <LoadingSpinner /> : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay programas B2B. Crea el primero.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Título</th>
                    <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Modalidad</th>
                    <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Duración</th>
                    <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Estado</th>
                    <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Fecha</th>
                    <th style={{ padding: '10px 8px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        {p.featured && '⭐ '}{p.title}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className="tag tag-outline" style={{ fontSize: '9px' }}>
                          {p.modality === 'presencial' ? '🏢 Presencial' : p.modality === 'online' ? '💻 Online' : '🔄 Híbrido'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>{p.duration || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{getStatusTag(p.status)}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                      <td style={{ padding: '10px 8px', display: 'flex', gap: '6px' }}>
                        <button className="btn-outline btn-small" onClick={() => startEdit(p)}>Editar</button>
                        <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(p.id)}>X</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
