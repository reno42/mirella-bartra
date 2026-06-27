import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

/**
 * Bidding — Directory position ranking.
 * Per acotaciones: NOT real-time.
 * Users deposit to bank account → admin verifies → admin manually updates ranking.
 * Higher bid = higher position in directory.
 */

const DIRECTION_LABELS = {
  asc: 'Menor → Mayor (1 = primero)',
  desc: 'Mayor → Menor (más alto = primero)',
}

export default function Bidding() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [bidDirection, setBidDirection] = useState('desc')

  const fetch = () => {
    setLoading(true)
    supabase.from('directory').select('*').order('bid_amount', { ascending: false })
      .then(({ data }) => setEntries(data || []))
      .finally(() => setLoading(false))
  }

  const fetchConfig = () => {
    supabase.from('cms_config').select('value').eq('id', 'bid_direction').single()
      .then(({ data }) => { if (data?.value) setBidDirection(data.value) })
  }

  useEffect(() => { fetch(); fetchConfig() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBidUpdate = async (id, field, value) => {
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const handleSaveBid = async (entry) => {
    const { error } = await supabase.from('directory').update({
      bid_amount: entry.bid_amount,
      bid_position: entry.bid_position,
      bid_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', entry.id)
    if (error) showToast('Error al guardar puja', 'error')
    else showToast(`Puja de ${entry.full_name} actualizada`)
  }

  const handleSaveDirection = async () => {
    setSaving(true)
    const { error } = await supabase.from('cms_config').upsert({
      id: 'bid_direction',
      value: bidDirection,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) showToast('Error al guardar dirección', 'error')
    else showToast('Dirección de ranking actualizada')
  }

  const handleRecalculate = () => {
    const sorted = [...entries].sort((a, b) => {
      const diff = (b.bid_amount || 0) - (a.bid_amount || 0)
      return bidDirection === 'desc' ? diff : -diff
    })
    sorted.forEach((e, i) => {
      supabase.from('directory').update({ bid_position: i + 1, updated_at: new Date().toISOString() }).eq('id', e.id).then(() => {})
    })
    showToast('Posiciones recalculadas')
    setTimeout(fetch, 500)
  }

  const hasBids = entries.filter(e => e.bid_amount > 0).length

  return (
    <>
      <Helmet><title>Pujas | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Pujas — Ranking del Directorio</h1>
      </div>

      {/* Instructions */}
      <div className="card-brutalist" style={{ padding: '12px 16px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-dark)' }}>ℹ️ Sistema manual:</strong> Los terapeutas depositan en la cuenta bancaria para aparecer primero en el directorio. El admin verifica el depósito y actualiza manualmente el monto de puja aquí. El ranking se ordena por monto de puja (mayor monto = mejor posición).{' '}
        <strong style={{ color: 'var(--text-dark)' }}>No es en tiempo real.</strong>
      </div>

      {/* Controls */}
      <div className="card-brutalist" style={{ padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Dirección del ranking:</span>
          <select
            className="input-brutalist"
            value={bidDirection}
            onChange={(e) => setBidDirection(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '11px' }}
          >
            <option value="desc">Mayor monto = Mejor posición</option>
            <option value="asc">Menor monto = Mejor posición</option>
          </select>
          <button className="btn-outline btn-small" onClick={handleSaveDirection} disabled={saving}>Guardar</button>
        </div>
        <button className="btn-accent btn-small" onClick={handleRecalculate}>
          🔄 Recalcular posiciones ({hasBids} pujas activas)
        </button>
      </div>

      {/* Bidding Table */}
      {loading ? <LoadingSpinner /> : entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay entradas en el directorio.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)', width: '40px' }}>Pos.</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Terapeuta</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Especialidad</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Puja (S/)</th>
                <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>Última puja</th>
                <th style={{ padding: '10px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)', background: (e.bid_amount || 0) > 0 ? 'rgba(167,243,208,0.05)' : 'transparent' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                    {e.bid_position || i + 1}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                    {e.full_name}
                    {(e.bid_amount || 0) > 0 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent-glow)', fontWeight: 700 }}>🏆</span>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{e.specialty || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="number"
                      className="input-brutalist"
                      value={e.bid_amount || 0}
                      onChange={(ev) => handleBidUpdate(e.id, 'bid_amount', parseFloat(ev.target.value) || 0)}
                      min="0"
                      step="0.01"
                      style={{ width: '100px', padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '10px' }}>
                    {e.bid_updated_at ? formatDate(e.bid_updated_at) : '—'}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <button className="btn-accent btn-small" onClick={() => handleSaveBid(e)}>💾 Guardar</button>
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
