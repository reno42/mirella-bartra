import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function FAQs() {
  const [faqs, setFaqs] = useState([]); const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ pregunta: '', respuesta: '', scope_type: 'page', pagina: 'home', orden: 0, publicado: true })
  const fetch = () => { setLoading(true); db.getAllFAQs().then(({ data }) => setFaqs(data || [])).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])
  const handleDelete = async (id) => { if (!confirm('¿Eliminar?')) return; await db.deleteFAQ(id); fetch() }
  const handleSubmit = async (e) => { e.preventDefault(); const { error } = await db.createFAQ(form); if (error) alert('Error'); else { setForm({ pregunta: '', respuesta: '', scope_type: 'page', pagina: 'home', orden: 0, publicado: true }); fetch() } }
  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <>
      <Helmet><title>FAQs | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>FAQs</h1>
      <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '16px', marginBottom: '24px', display: 'grid', gap: '10px', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700 }}>Nueva FAQ</h3>
        <input className="input-brutalist" placeholder="Pregunta *" value={form.pregunta} onChange={u('pregunta')} required />
        <textarea className="input-brutalist" placeholder="Respuesta *" value={form.respuesta} onChange={u('respuesta')} rows={3} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <input className="input-brutalist" placeholder="Página (ej. home)" value={form.pagina} onChange={u('pagina')} />
          <input className="input-brutalist" type="number" placeholder="Orden" value={form.orden} onChange={u('orden')} />
          <select className="input-brutalist" value={form.publicado} onChange={e => setForm(p => ({ ...p, publicado: e.target.value === 'true' }))}>
            <option value="true">Publicado</option><option value="false">Oculto</option>
          </select>
        </div>
        <button type="submit" className="btn-accent btn-small">Agregar FAQ</button>
      </form>
      {loading ? <LoadingSpinner /> : faqs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No hay FAQs.</p> : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {faqs.map(f => (
            <div key={f.id} className="card-brutalist" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{f.pregunta}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.respuesta?.slice(0, 80)}...</div>
                <span className="tag tag-outline" style={{ fontSize: '9px', marginTop: '6px', display: 'inline-block' }}>{f.pagina} · orden {f.orden}</span>
              </div>
              <button className="btn-outline btn-small" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(f.id)}>X</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
