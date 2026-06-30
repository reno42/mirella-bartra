import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import { generateMetaTags } from '@/lib/seo.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'
import NewsletterCTA from '@/components/NewsletterCTA.jsx'

export default function Directorio() {
  const [entries, setEntries] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTherapist, setSelectedTherapist] = useState(null)

  useEffect(() => {
    Promise.all([
      db.getDirectory(),
      db.getCategories(),
    ]).then(([dirRes, catRes]) => {
      setEntries(dirRes.data || [])
      setSpecialties(catRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const topTherapists = entries.filter(e => e.is_top)
  const regularTherapists = selectedSpecialty
    ? entries.filter(e => !e.is_top && e.specialty === selectedSpecialty)
    : entries.filter(e => !e.is_top)
  const filtered = selectedSpecialty
    ? entries.filter(e => e.specialty === selectedSpecialty)
    : entries

  const meta = generateMetaTags({
    title: 'Directorio de Terapeutas de Lenguaje',
    description: 'Encuentra terapeutas de lenguaje certificados. El directorio más grande del continente.',
    type: 'website',
  })

  return (
    <>
      <Helmet {...meta} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size={36} /></div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(24px, 5vw, 40px)', marginBottom: '8px' }}>
                Directorio
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px' }}>
                Encuentra terapeutas de lenguaje por especialidad y ubicación.
              </p>
            </div>
            <Link to="/directorio/inscribirse" className="btn-accent">Inscribirme gratis</Link>
          </div>

          {specialties.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                className={`tag ${!selectedSpecialty ? '' : 'tag-outline'}`}
                onClick={() => setSelectedSpecialty('')}
                style={{ cursor: 'pointer' }}
              >
                Todas
              </button>
              {specialties.map(s => (
                <button
                  key={s.id || s.name}
                  className={`tag ${selectedSpecialty === s.name ? '' : 'tag-outline'}`}
                  onClick={() => setSelectedSpecialty(s.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No se encontraron terapeutas en esta categoría.</p>
          ) : (
            <>
              {/* ── Top Terapeutas ── */}
              {topTherapists.length > 0 && (
                <section style={{ marginBottom: '40px' }}>
                  <div className="press-section-header">
                    <h2>Top Terapeutas Recomendados</h2>
                  </div>
                  <div className="grid-auto-fill">
                    {topTherapists.map(entry => (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedTherapist(entry)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-brutalist" style={{ height: '100%', borderColor: 'var(--text-dark)', borderWidth: '2px', background: 'var(--accent-glow)' }}>
                          <div style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', background: 'var(--text-dark)',
                                color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '18px', fontFamily: 'var(--font-display)', flexShrink: 0,
                                border: '2px solid var(--text-dark)',
                              }}>
                                {entry.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  {entry.full_name}
                                </h3>
                                <span className="tag" style={{ fontSize: '9px' }}>{entry.specialty || 'Fonoaudiología'}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                              {entry.city && <div>📍 {entry.city}</div>}
                              {entry.years_experience && <div>📋 {entry.years_experience} años de experiencia</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Todos los terapeutas ── */}
              <section>
                {topTherapists.length > 0 && (
                  <div className="press-section-header">
                    <h2>Todos los Terapeutas</h2>
                  </div>
                )}
                <div className="grid-auto-fill">
                  {(topTherapists.length > 0 ? regularTherapists : filtered).map(entry => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedTherapist(entry)}
                      style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <div className="card-brutalist" style={{ height: '100%' }}>
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '50%', background: 'var(--text-dark)',
                              color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-display)', flexShrink: 0,
                            }}>
                              {entry.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                {entry.full_name}
                              </h3>
                              <span className="tag tag-outline" style={{ fontSize: '9px' }}>{entry.specialty || 'Fonoaudiología'}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {entry.city && <div>📍 {entry.city}</div>}
                            {entry.years_experience && <div>📋 {entry.years_experience} años de experiencia</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <NewsletterCTA />
        </>
      )}

      {/* ── Therapist Modal Popup ── */}
      {selectedTherapist && (
        <TherapistModal
          therapist={selectedTherapist}
          onClose={() => setSelectedTherapist(null)}
        />
      )}
    </>
  )
}

// ─── Therapist Modal Component ─────────────────────────────────
function TherapistModal({ therapist, onClose }) {
  const [contactSent, setContactSent] = useState(false)
  const phoneClean = therapist.phone ? therapist.phone.replace(/[^0-9]/g, '') : ''
  const whatsappUrl = phoneClean ? `https://wa.me/${phoneClean}` : ''
  const emailUrl = therapist.email ? `mailto:${therapist.email}` : ''
  const mapQuery = encodeURIComponent(`${therapist.full_name}, ${therapist.city || ''}, ${therapist.country || 'Perú'}`)
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=-77.15%2C-12.15%2C-76.95%2C-11.95&layer=mapnik&marker=-12.05%2C-77.05`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="modal-body">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', background: 'var(--text-dark)',
              color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '24px', fontFamily: 'var(--font-display)', flexShrink: 0,
              border: '2px solid var(--text-dark)',
            }}>
              {therapist.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '22px', lineHeight: 1.2, marginBottom: '6px' }}>
                {therapist.full_name}
              </h2>
              <span className="tag">{therapist.specialty || 'Fonoaudiología'}</span>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {therapist.city && (
              <div className="card-brutalist" style={{ padding: '10px', fontSize: '12px' }}>📍 {therapist.city}</div>
            )}
            {therapist.years_experience > 0 && (
              <div className="card-brutalist" style={{ padding: '10px', fontSize: '12px' }}>📋 {therapist.years_experience} años exp.</div>
            )}
            {therapist.institution && (
              <div className="card-brutalist" style={{ padding: '10px', fontSize: '12px' }}>🎓 {therapist.institution}</div>
            )}
            {therapist.offers_online && therapist.offers_presencial && (
              <div className="card-brutalist" style={{ padding: '10px', fontSize: '12px' }}>💻 Online + 🏠 Presencial</div>
            )}
          </div>

          {/* Bio */}
          {therapist.bio && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Biografía</div>
              <p style={{ fontSize: '13px', color: 'var(--text-dark)', lineHeight: 1.7 }}>{therapist.bio}</p>
            </div>
          )}

          {/* Contact buttons */}
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Contacto directo</div>
          <div className="contact-btn-row">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-whatsapp">
                WhatsApp
              </a>
            )}
            {emailUrl && (
              <a href={emailUrl} className="contact-btn contact-btn-email">
                Correo
              </a>
            )}
          </div>

          {/* Contact form */}
          {!contactSent ? (
            <form
              style={{ marginTop: '20px' }}
              onSubmit={async (e) => {
                e.preventDefault()
                const name = e.target.name.value
                const email = e.target.email.value
                const message = e.target.message.value
                const { error } = await db.createLead({
                  name,
                  email,
                  message: `Contacto para ${therapist.full_name}: ${message}`,
                  source: 'directorio_modal',
                  therapist_id: therapist.id,
                })
                if (!error) setContactSent(true)
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Enviar mensaje</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input name="name" type="text" placeholder="Tu nombre" required className="input-brutalist" style={{ fontSize: '12px' }} />
                <input name="email" type="email" placeholder="Tu correo" required className="input-brutalist" style={{ fontSize: '12px' }} />
              </div>
              <textarea name="message" placeholder="Tu mensaje" required className="input-brutalist" style={{ fontSize: '12px', minHeight: '80px', marginBottom: '8px' }} />
              <button type="submit" className="btn-primary btn-small" style={{ width: '100%' }}>Enviar mensaje</button>
            </form>
          ) : (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--accent-glow)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 700 }}>¡Mensaje enviado! El terapeuta se pondrá en contacto pronto.</p>
            </div>
          )}

          {/* Map */}
          {therapist.city && (
            <div className="modal-map">
              <iframe
                src={mapSrc}
                title={`Ubicación de ${therapist.full_name}`}
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
