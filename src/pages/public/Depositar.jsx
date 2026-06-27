import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { db, storage } from '@/lib/supabase.js'

/**
 * DepositForm — Public page where users submit their payment proof.
 * Per acotaciones: NO payment gateway.
 * User deposits to bank account manually, then uploads:
 *   - transaction code (código de transacción)
 *   - first name + last name
 *   - amount deposited
 *   - screenshot of the transfer
 *   - reference/concept (e.g., course name, bidding)
 */

const BANK_INFO = {
  bank: 'BCP',
  account_type: 'Cuenta Corriente',
  account_number: '194-XXXXXXX-0-XX',
  account_holder: 'Mirella Bartra',
  currency: 'S/',
}

export default function DepositForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    transaction_code: '',
    amount: '',
    currency: 'S/',
    concept: '',
    bank: BANK_INFO.bank,
    notes: '',
  })
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const u = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe exceder 5MB.'); return }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate required fields explícitamente como pide el usuario
    if (!form.transaction_code.trim()) { setError('El código de transacción es obligatorio.'); return }
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('Nombre y apellidos son obligatorios.'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('La cantidad debe ser mayor a 0.'); return }
    if (!screenshot) { setError('La captura de pantalla del depósito es obligatoria.'); return }

    setSubmitting(true)

    // Upload screenshot to Supabase Storage
    let screenshotUrl = ''
    if (screenshot) {
      const path = `deposits/${Date.now()}_${screenshot.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadError } = await storage.uploadFile('media', screenshot, path)

      if (!uploadError) {
        screenshotUrl = storage.getPublicUrl('media', path)
      }
    }

    // Create deposit record
    const { error: depositError } = await db.createDeposit({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      transaction_code: form.transaction_code,
      amount: parseFloat(form.amount),
      currency: form.currency,
      concept: form.concept,
      bank: form.bank,
      notes: form.notes,
      screenshot_url: screenshotUrl,
      status: 'pending',
    })

    setSubmitting(false)

    if (depositError) {
      setError('Error al registrar el depósito: ' + depositError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 5000)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <Helmet><title>Depósito Registrado | Mirella Bartra</title></Helmet>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '12px' }}>¡Depósito registrado!</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          Tu comprobante ha sido enviado. Nuestro equipo lo revisará en un plazo de 24 a 48 horas hábiles.
          Recibirás una confirmación por correo electrónico.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Serás redirigido al inicio en unos segundos...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>
      <Helmet><title>Registrar Depósito | Mirella Bartra</title></Helmet>

      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '8px' }}>Registrar Depósito</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
        Realiza tu depósito en la cuenta bancaria indicada y completa este formulario con los datos de tu transacción.
        <strong> No usamos pasarela de pago automática.</strong> Todos los depósitos son verificados manualmente.
      </p>

      {/* Bank Info */}
      <div className="card-brutalist" style={{ padding: '16px', marginBottom: '24px', background: '#f0fdf4' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' }}>🏦 Datos Bancarios</h3>
        <div style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
          <div><strong>Banco:</strong> {BANK_INFO.bank}</div>
          <div><strong>Tipo:</strong> {BANK_INFO.account_type}</div>
          <div><strong>N° Cuenta:</strong> <code style={{ fontFamily: 'var(--font-mono)', background: 'white', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{BANK_INFO.account_number}</code></div>
          <div><strong>Titular:</strong> {BANK_INFO.account_holder}</div>
          <div><strong>Moneda:</strong> {BANK_INFO.currency} (Soles peruanos)</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-brutalist" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase' }}>📎 Datos del Depósito</h3>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '12px', marginBottom: '16px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input className="input-brutalist" value={form.first_name} onChange={u('first_name')} placeholder="Tu nombre" required />
            </div>
            <div>
              <label style={labelStyle}>Apellidos *</label>
              <input className="input-brutalist" value={form.last_name} onChange={u('last_name')} placeholder="Tus apellidos" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="input-brutalist" type="email" value={form.email} onChange={u('email')} placeholder="tu@email.com" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input className="input-brutalist" type="tel" value={form.phone} onChange={u('phone')} placeholder="+51 999 999 999" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Código de Transacción *</label>
            <input className="input-brutalist" value={form.transaction_code} onChange={u('transaction_code')} placeholder="Número de operación del banco" required />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              Es el número que aparece en tu comprobante de depósito/transferencia.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Moneda</label>
              <select className="input-brutalist" value={form.currency} onChange={u('currency')}>
                <option value="S/">S/ (Soles)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Cantidad Depositada *</label>
              <input className="input-brutalist" type="number" step="0.01" min="0.01" value={form.amount} onChange={u('amount')} placeholder="0.00" required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Concepto / Referencia</label>
            <input className="input-brutalist" value={form.concept} onChange={u('concept')} placeholder="Ej: Curso de Terapia Ocupacional, Puja Directorio, etc." />
          </div>

          <div>
            <label style={labelStyle}>Notas adicionales</label>
            <textarea className="input-brutalist" value={form.notes} onChange={u('notes')} rows={2} placeholder="Cualquier información adicional que quieras agregar..." />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label style={labelStyle}>Captura de Pantalla del Depósito *</label>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              background: preview ? 'transparent' : 'var(--bg-base)',
            }}>
              {preview ? (
                <div>
                  <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', marginBottom: '8px' }} />
                  <button type="button" className="btn-outline btn-small" onClick={() => { setScreenshot(null); setPreview(null) }}>Quitar imagen</button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>📸</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Click para subir captura</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>JPG, PNG o WEBP. Máx 5MB.</div>
                  <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '8px', justifyContent: 'center', padding: '12px' }}>
            {submitting ? 'Enviando...' : '📤 Enviar comprobante de depósito'}
          </button>

          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px', lineHeight: 1.4 }}>
            Al enviar este formulario, confirmas que has realizado el depósito y que los datos ingresados son correctos.
            Tu información será revisada por nuestro equipo en un plazo de 24-48 horas hábiles.
          </p>
        </div>
      </form>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  marginBottom: '4px',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
