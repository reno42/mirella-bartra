import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { db, users } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

/**
 * Certificados — Admin-only module.
 *
 * Generates certificates in bulk as a single multi-page PDF (one per attendee).
 * Three ways to build the attendee list:
 *   1. Desde Evento: pick an event, loads its event_registrations, 1-click generate
 *   2. Manual: paste names (one per line, "Nombre, email" optional)
 *   3. CSV: upload a CSV file (template available for download)
 *
 * Every generation is recorded in the `certificates` table for CRM tracking.
 */

const ACCENT = { r: 167, g: 243, b: 208 }   // #a7f3d0
const ACCENT_DEEP = { r: 13, g: 148, b: 136 } // #0d9488
const DARK = { r: 17, g: 17, b: 17 }        // #111111

const TABS = [
  { id: 'evento', label: 'Desde Evento', icon: '📅' },
  { id: 'manual', label: 'Manual', icon: '✏️' },
  { id: 'csv', label: 'CSV', icon: '📄' },
]

export default function Certificados() {
  // Role gate
  const [roleCheck, setRoleCheck] = useState('loading') // loading | ok | denied

  // Shared state
  const [tab, setTab] = useState('evento')
  const [events, setEvents] = useState([])
  const [config, setConfig] = useState({
    event_title: '',
    event_date: '',
    hours: '',
    instructor: 'Mirella Bartra',
    instructor_role: 'Fonoaudióloga · Docente UNFV',
  })
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const [history, setHistory] = useState([])

  // Event tab state
  const [selectedEvent, setSelectedEvent] = useState('')
  const [registrants, setRegistrants] = useState([])
  const [registrantsLoading, setRegistrantsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Manual tab state
  const [manualNames, setManualNames] = useState('')

  // CSV tab state
  const [csvRows, setCsvRows] = useState([])
  const fileRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Initial load: role + events + certificate history
  useEffect(() => {
    users.getMyProfile().then(({ data: profile }) => {
      setRoleCheck(profile?.role === 'admin' ? 'ok' : 'denied')
    }).catch(() => setRoleCheck('denied'))

    db.getAllEvents().then(({ data }) => setEvents(data || []))
    db.getCertificates().then(({ data }) => setHistory(data || []))
  }, [])

  const u = (field) => (e) => setConfig(p => ({ ...p, [field]: e.target.value }))

  // ── Event selection ──
  const handleSelectEvent = async (eventId) => {
    setSelectedEvent(eventId)
    setCsvRows([])
    setManualNames('')
    if (!eventId) { setRegistrants([]); setSelectedIds(new Set()); return }

    const ev = events.find(e => e.id === eventId)
    if (ev) {
      setConfig(p => ({
        ...p,
        event_title: ev.title || ev.name || '',
        event_date: ev.start_date || '',
      }))
    }

    setRegistrantsLoading(true)
    const { data, error } = await db.getEventRegistrations(eventId)
    setRegistrantsLoading(false)
    if (error) {
      showToast('Error cargando inscritos: ' + error.message, 'error')
      setRegistrants([])
      return
    }
    setRegistrants((data || []).filter(r => r.registration_status !== 'cancelled'))
    setSelectedIds(new Set((data || []).map(r => r.id)))
  }

  const toggleRegistrant = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Manual parsing: one per line, "Nombre" or "Nombre, email" ──
  const parseManual = () => manualNames
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const [name, email] = line.split(',').map(s => s.trim())
      return { full_name: name, email: email || null }
    })
    .filter(p => p.full_name)

  // ── CSV parsing ──
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
      const parsed = rows.map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        return { full_name: cols[0], email: cols[1] || null, document_number: cols[2] || null }
      }).filter(p => p.full_name && p.full_name.toLowerCase() !== 'nombre')
      setCsvRows(parsed)
      const ev = events.find(ev => ev.id === selectedEvent)
      if (parsed.length > 0 && !config.event_title) {
        setConfig(p => ({ ...p, event_title: ev?.title || ev?.name || p.event_title }))
      }
      showToast(`${parsed.length} nombres importados del CSV`)
    }
    reader.readAsText(file)
  }

  const downloadCSVTemplate = () => {
    const csv = 'nombre,email,documento\n"Dra. Elena Vargas Torres","elena@correo.com","DNI 45781236"\n"Lic. Ana Quispe","ana@correo.com","DNI 41236587"'
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_certificados.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Collect the final participant list from the active tab ──
  const getParticipants = () => {
    if (tab === 'evento') {
      return registrants
        .filter(r => selectedIds.has(r.id))
        .map(r => ({ full_name: r.full_name, email: r.email, document_number: r.document_number }))
    }
    if (tab === 'manual') return parseManual()
    if (tab === 'csv') return csvRows
    return []
  }

  // ── PDF generation (brutalist certificate, landscape A4) ──
  const drawCertificatePage = (doc, participant, code, index) => {
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()

    // Outer dark frame
    doc.setFillColor(DARK.r, DARK.g, DARK.b)
    doc.rect(0, 0, W, H, 'F')

    // Inner paper
    const M = 18
    doc.setFillColor(237, 237, 235)
    doc.rect(M, M, W - M * 2, H - M * 2, 'F')

    // Accent inner frame
    doc.setDrawColor(ACCENT_DEEP.r, ACCENT_DEEP.g, ACCENT_DEEP.b)
    doc.setLineWidth(1.5)
    doc.rect(M + 8, M + 8, W - M * 2 - 16, H - M * 2 - 16)

    // Top accent band
    doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
    doc.rect(M + 8, M + 8, W - M * 2 - 16, 14, 'F')

    // Brand
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('MIRELLABARTRA.COM', W / 2, M + 40, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(85, 85, 85)
    doc.text('PRIMER MEDIO DE PRENSA PARA TERAPEUTAS', W / 2, M + 48, { align: 'center' })

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(30)
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text('CERTIFICADO DE PARTICIPACIÓN', W / 2, M + 78, { align: 'center' })

    // Divider
    doc.setDrawColor(ACCENT_DEEP.r, ACCENT_DEEP.g, ACCENT_DEEP.b)
    doc.setLineWidth(2)
    doc.line(W / 2 - 70, M + 86, W / 2 + 70, M + 86)

    // Otorgado a
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(85, 85, 85)
    doc.text('Se certifica que', W / 2, M + 104, { align: 'center' })

    // Participant name (auto-shrink for long names)
    let nameSize = 34
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(nameSize)
    const maxW = W - M * 2 - 80
    while (doc.getTextWidth(participant.full_name) > maxW && nameSize > 14) {
      nameSize -= 2
      doc.setFontSize(nameSize)
    }
    doc.text(participant.full_name.toUpperCase(), W / 2, M + 126, { align: 'center' })

    // Accent underline for the name
    const nameW = Math.min(doc.getTextWidth(participant.full_name.toUpperCase()) + 20, maxW)
    doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
    doc.rect(W / 2 - nameW / 2, M + 132, nameW, 4, 'F')

    // Event info
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(51, 51, 51)
    const evTitle = `participó en «${config.event_title || 'Evento de formación'}»`
    doc.text(evTitle, W / 2, M + 152, { align: 'center' })

    const details = [
      config.hours ? `con una duración de ${config.hours} horas académicas` : '',
      config.event_date ? `Fecha: ${formatDate(config.event_date)}` : '',
    ].filter(Boolean).join('  ·  ')
    if (details) {
      doc.setFontSize(10)
      doc.setTextColor(85, 85, 85)
      doc.text(details, W / 2, M + 164, { align: 'center' })
    }

    // Signature
    const sigY = H - M - 58
    doc.setDrawColor(DARK.r, DARK.g, DARK.b)
    doc.setLineWidth(0.8)
    doc.line(W / 2 - 90, sigY, W / 2 - 20, sigY)
    doc.line(W / 2 + 20, sigY, W / 2 + 90, sigY)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text(config.instructor || 'Mirella Bartra', W / 2 - 55, sigY + 12, { align: 'center' })
    doc.text('MIRELLABARTRA.COM', W / 2 + 55, sigY + 12, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(85, 85, 85)
    doc.text(config.instructor_role || 'Fonoaudióloga', W / 2 - 55, sigY + 18, { align: 'center' })
    doc.text('Certificación oficial', W / 2 + 55, sigY + 18, { align: 'center' })

    // Verification code + page number
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(85, 85, 85)
    doc.text(`Código de verificación: ${code}`, W / 2, H - M - 22, { align: 'center' })
    doc.text(`Documento ${String(index + 1).padStart(2, '0')}`, W / 2, H - M - 14, { align: 'center' })
  }

  const generateCode = (participant, i) =>
    `MB-${(config.event_title || 'EVT').slice(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now().toString(36).toUpperCase().slice(-4)}-${String(i + 1).padStart(3, '0')}`

  const handleGenerate = async () => {
    const participants = getParticipants()
    if (participants.length === 0) {
      showToast('No hay participantes en la lista.', 'error')
      return
    }
    if (!config.event_title.trim()) {
      showToast('Ingresa el nombre del taller o congreso.', 'error')
      return
    }

    setGenerating(true)
    try {
      // Lazy-load jsPDF only when generating (keeps main bundle small)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const codes = participants.map((p, i) => generateCode(p, i))

      participants.forEach((p, i) => {
        if (i > 0) doc.addPage('a4', 'landscape')
        drawCertificatePage(doc, p, codes[i], i)
      })

      // Single download: all certificates in one PDF
      const safeTitle = config.event_title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_')
      doc.save(`Certificados_${safeTitle}.pdf`)

      // Record in DB for CRM tracking
      const records = participants.map((p, i) => ({
        person_name: p.full_name,
        person_email: p.email || null,
        document_number: p.document_number || null,
        event_id: tab === 'evento' && selectedEvent ? selectedEvent : null,
        event_title: config.event_title,
        hours: config.hours ? parseFloat(config.hours) : null,
        certificate_code: codes[i],
        source: tab,
      }))
      const { error } = await db.createCertificates(records)
      if (error) showToast(`PDFs generados, pero hubo un error guardando el registro: ${error.message}`, 'error')
      else {
        showToast(`✔ ${participants.length} certificados generados y registrados.`)
        db.getCertificates().then(({ data }) => setHistory(data || []))
      }
    } catch (err) {
      console.error(err)
      showToast('Error generando el PDF: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const participants = getParticipants()

  // ── Role gate render ──
  if (roleCheck === 'loading') return <div style={{ textAlign: 'center', padding: '80px 0' }}><LoadingSpinner /></div>
  if (roleCheck === 'denied') {
    return (
      <>
        <Helmet><title>Certificados | Mirella Admin</title></Helmet>
        <div className="card-brutalist" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
          <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '8px' }}>Acceso restringido</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            El módulo de certificados está disponible solo para cuentas con rol <strong>admin</strong>.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><title>Certificados | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '24px' }}>Certificados</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Genera certificados en PDF por taller, congreso o workshop — un click, todos los inscritos.</p>
        </div>
        <button className="btn-accent" onClick={handleGenerate} disabled={generating || participants.length === 0}>
          {generating ? 'Generando...' : `🎓 Generar ${participants.length > 0 ? participants.length + ' certificados' : 'PDF'}`}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'btn-primary btn-small' : 'btn-outline btn-small'}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: '16px', alignItems: 'start' }}>
        {/* ── Left column: source ── */}
        <div className="card-brutalist" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Lista de participantes
          </h3>

          {tab === 'evento' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Evento / Taller</label>
                <select className="input-brutalist" value={selectedEvent} onChange={e => handleSelectEvent(e.target.value)}>
                  <option value="">— Selecciona un evento —</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title || ev.name} ({formatDate(ev.start_date)})</option>
                  ))}
                </select>
              </div>

              {registrantsLoading ? <LoadingSpinner /> : selectedEvent && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {registrants.length} inscritos · {selectedIds.size} seleccionados
                    </span>
                    <button className="btn-outline btn-small" onClick={() => setSelectedIds(new Set(registrants.map(r => r.id)))}>
                      Todos
                    </button>
                  </div>
                  {registrants.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-base)', borderRadius: '8px' }}>
                      Este evento no tiene inscritos aún. Puedes añadirlos desde la sección Eventos → Inscritos.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                      {registrants.map(r => (
                        <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: selectedIds.has(r.id) ? 'var(--accent-glow)' : 'white' }}>
                          <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleRegistrant(r.id)} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.email} {r.registration_status === 'attended' ? '· ✅ asistió' : ''}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <div>
              <label style={labelStyle}>Nombres (uno por línea — opcional: "Nombre, email")</label>
              <textarea
                className="input-brutalist"
                rows={10}
                value={manualNames}
                onChange={e => setManualNames(e.target.value)}
                placeholder={'Dra. Elena Vargas Torres, elena@correo.com\nLic. Ana Quispe\nDr. Roberto Castillo, roberto@correo.com'}
              />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {parseManual().length} nombres detectados
              </p>
            </div>
          )}

          {tab === 'csv' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-outline btn-small" onClick={() => fileRef.current?.click()}>📎 Subir CSV</button>
                <button className="btn-outline btn-small" onClick={downloadCSVTemplate}>⬇ Descargar plantilla</button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Formato: <code>nombre,email,documento</code> (email y documento opcionales)
              </p>
              {csvRows.length > 0 && (
                <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'grid', gap: '4px' }}>
                  {csvRows.map((r, i) => (
                    <div key={i} style={{ fontSize: '12px', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                      <strong>{r.full_name}</strong> {r.email && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>· {r.email}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column: config + history ── */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="card-brutalist" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Datos del certificado
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nombre del taller / congreso *</label>
                <input className="input-brutalist" value={config.event_title} onChange={u('event_title')} placeholder="Ej: I Congreso Latinoamericano de Fonoaudiología" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input className="input-brutalist" type="date" value={config.event_date} onChange={u('event_date')} />
                </div>
                <div>
                  <label style={labelStyle}>Horas académicas</label>
                  <input className="input-brutalist" type="number" min="0" step="0.5" value={config.hours} onChange={u('hours')} placeholder="16" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Firma (nombre)</label>
                <input className="input-brutalist" value={config.instructor} onChange={u('instructor')} />
              </div>
              <div>
                <label style={labelStyle}>Cargo / título de quien firma</label>
                <input className="input-brutalist" value={config.instructor_role} onChange={u('instructor_role')} />
              </div>
            </div>
          </div>

          <div className="card-brutalist" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Historial ({history.length})
            </h3>
            {history.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aún no se han generado certificados.</p>
            ) : (
              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                {history.slice(0, 30).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                    <span style={{ fontWeight: 600 }}>{c.person_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{c.event_title} · {formatDate(c.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  marginBottom: '4px',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
