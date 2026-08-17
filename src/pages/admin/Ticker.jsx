import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Ticker() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const fetchMessages = () => {
    setLoading(true)
    db.getAllTickerMessages()
      .then(({ data }) => setMessages(data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchMessages() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return
    setSaving(true)
    const maxOrder = messages.reduce((max, m) => Math.max(max, m.sort_order || 0), 0)
    const { error } = await db.createTickerMessage({ text, is_active: true, sort_order: maxOrder + 1 })
    setSaving(false)
    if (error) {
      alert(error.code === '23505'
        ? 'Esa frase ya existe.'
        : 'Error al crear: ' + (error.message || 'verifica que eres admin'))
      return
    }
    setNewText('')
    fetchMessages()
  }

  const toggleActive = async (m) => {
    const { error } = await db.updateTickerMessage(m.id, { is_active: !m.is_active })
    if (error) return alert('Error: ' + (error.message || ''))
    fetchMessages()
  }

  const handleDelete = async (m) => {
    if (!confirm(`¿Eliminar la frase "${m.text}"?`)) return
    const { error } = await db.deleteTickerMessage(m.id)
    if (error) return alert('Error: ' + (error.message || ''))
    fetchMessages()
  }

  const startEdit = (m) => {
    setEditingId(m.id)
    setEditText(m.text)
  }

  const saveEdit = async () => {
    const text = editText.trim()
    if (!text) return
    const { error } = await db.updateTickerMessage(editingId, { text })
    if (error) {
      alert(error.code === '23505'
        ? 'Esa frase ya existe.'
        : 'Error al guardar: ' + (error.message || ''))
      return
    }
    setEditingId(null)
    setEditText('')
    fetchMessages()
  }

  // Reordenar: swap en la lista + persistir el nuevo orden completo
  const move = async (index, dir) => {
    const j = index + dir
    if (j < 0 || j >= messages.length) return
    const arr = [...messages]
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
    setMessages(arr)
    await Promise.all(arr.map((m, i) => db.updateTickerMessage(m.id, { sort_order: i + 1 })))
  }

  const activeCount = messages.filter((m) => m.is_active).length

  return (
    <>
      <Helmet><title>Ticker | Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '6px' }}>
        Barra de Anuncios (Ticker)
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '600px', lineHeight: 1.6 }}>
        Las frases <strong>publicadas</strong> aparecen en la barra negra superior del sitio, en movimiento.
        Las frases <strong>ocultas</strong> quedan guardadas como versiones anteriores sin mostrarse.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span className="tag">{activeCount} publicadas</span>
        <span className="tag tag-outline">{messages.length - activeCount} ocultas</span>
        <span className="tag tag-outline">{messages.length} en total</span>
      </div>

      {/* Nueva frase */}
      <form onSubmit={handleAdd} className="card-brutalist" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '10px', maxWidth: '700px', flexWrap: 'wrap' }}>
        <input
          className="input-brutalist"
          style={{ flex: 1, minWidth: '240px' }}
          placeholder="Nueva frase para la barra superior…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          maxLength={200}
          required
        />
        <button type="submit" className="btn-accent btn-small" disabled={saving}>
          {saving ? 'Agregando…' : '+ Agregar'}
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <LoadingSpinner />
      ) : messages.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay frases todavía. Agrega la primera arriba.</p>
      ) : (
        <div style={{ display: 'grid', gap: '8px', maxWidth: '700px' }}>
          {messages.map((m, i) => (
            <div
              key={m.id}
              className="card-brutalist"
              style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                opacity: m.is_active ? 1 : 0.6,
              }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                {editingId === m.id ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      className="input-brutalist"
                      style={{ flex: 1, minWidth: '200px' }}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={200}
                      autoFocus
                    />
                    <button className="btn-primary btn-small" onClick={saveEdit}>Guardar</button>
                    <button className="btn-outline btn-small" onClick={() => setEditingId(null)}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.text}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {m.is_active ? 'PUBLICADA' : 'OCULTA (versión anterior)'} · orden {i + 1}
                      {m.updated_at && ` · act. ${new Date(m.updated_at).toLocaleDateString('es-PE')}`}
                    </div>
                  </>
                )}
              </div>
              {editingId !== m.id && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-outline btn-small" onClick={() => move(i, -1)} disabled={i === 0} title="Subir">↑</button>
                  <button className="btn-outline btn-small" onClick={() => move(i, 1)} disabled={i === messages.length - 1} title="Bajar">↓</button>
                  <button className="btn-outline btn-small" onClick={() => startEdit(m)} title="Editar">✏️</button>
                  <button
                    className={m.is_active ? 'btn-outline btn-small' : 'btn-accent btn-small'}
                    onClick={() => toggleActive(m)}
                  >
                    {m.is_active ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button
                    className="btn-outline btn-small"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => handleDelete(m)}
                    title="Eliminar"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
