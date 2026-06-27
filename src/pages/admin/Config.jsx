import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const DEFAULT_CONFIG = {
  site_name: 'Mirella Bartra',
  site_description: 'El primer medio oficial para terapeutas de todo el continente.',
  site_url: 'https://mirellabartra.com',
  default_meta_title: 'Mirella Bartra — Terapia, Ciencia y Comunidad',
  default_meta_description: 'Noticias, papers académicos, directorio de terapeutas, cursos online y más.',
  og_image: '',
  twitter_handle: '@mirellabartra',
  google_analytics_id: '',
  google_site_verification: '',
  recaptcha_site_key: '',
  contact_email: 'contacto@mirellabartra.com',
  phone: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  youtube_url: '',
  tiktok_url: '',
  whatsapp_number: '',
  hero_headline: 'Terapia, Ciencia y Comunidad',
  hero_subheadline: 'El primer medio oficial para terapeutas de habla hispana.',
  newsletter_cta: 'Suscríbete a nuestro newsletter',
  footer_text: '© Mirella Bartra. Todos los derechos reservados.',
  maintenance_mode: false,
}

export default function Config() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    db.getAllCMSConfig().then(({ data }) => {
      if (!data || data.length === 0) {
        setConfig(DEFAULT_CONFIG)
      } else {
        const merged = { ...DEFAULT_CONFIG }
        data.forEach(row => {
          let val = row.value
          if (val === 'true') val = true
          else if (val === 'false') val = false
          merged[row.id || row.key] = val
        })
        setConfig(merged)
      }
    }).finally(() => setLoading(false))
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const promises = Object.entries(config).map(([key, value]) =>
      db.updateCMSConfig(key, String(value))
    )
    const results = await Promise.all(promises)
    const hasError = results.some(r => r.error)
    setSaving(false)
    if (hasError) showToast('Error al guardar algunos valores', 'error')
    else showToast('Configuración guardada correctamente')
  }

  const u = (key) => (e) => setConfig(p => ({
    ...p,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const Section = ({ title, children }) => (
    <div className="card-brutalist" style={{ padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>{title}</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {children}
      </div>
    </div>
  )

  const Field = ({ label, name, type = 'text', placeholder, isTextarea, isCheckbox }) => (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</label>
      {isCheckbox ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
          <input type="checkbox" checked={config[name] || false} onChange={u(name)} />
          {placeholder}
        </label>
      ) : isTextarea ? (
        <textarea className="input-brutalist" name={name} value={config[name] || ''} onChange={u(name)} placeholder={placeholder} rows={3} />
      ) : (
        <input className="input-brutalist" type={type} name={name} value={config[name] || ''} onChange={u(name)} placeholder={placeholder} />
      )}
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><LoadingSpinner /></div>

  return (
    <>
      <Helmet><title>Configuración | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Configuración</h1>
        <button className="btn-accent btn-small" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar todo'}
        </button>
      </div>

      <form onSubmit={handleSave}>
        <Section title="General">
          <Field label="Nombre del sitio" name="site_name" placeholder="Mirella Bartra" />
          <Field label="URL del sitio" name="site_url" type="url" placeholder="https://mirellabartra.com" />
          <Field label="Descripción del sitio" name="site_description" isTextarea placeholder="Descripción corta del sitio" />
          <Field label="Email de contacto" name="contact_email" type="email" />
          <Field label="Teléfono" name="phone" />
          <Field label="Dirección" name="address" isTextarea />
          <Field label="Modo mantenimiento" name="maintenance_mode" isCheckbox placeholder="Activar página de mantenimiento" />
        </Section>

        <Section title="SEO Global">
          <Field label="Meta título por defecto" name="default_meta_title" placeholder="Título para páginas sin SEO custom" />
          <Field label="Meta descripción por defecto" name="default_meta_description" isTextarea placeholder="Descripción para páginas sin SEO custom" />
          <Field label="Open Graph Image URL" name="og_image" type="url" placeholder="https://... imagen default para compartir" />
          <Field label="Twitter Handle" name="twitter_handle" placeholder="@mirellabartra" />
        </Section>

        <Section title="Google & Analytics">
          <Field label="Google Analytics ID" name="google_analytics_id" placeholder="G-XXXXXXXXXX" />
          <Field label="Google Site Verification" name="google_site_verification" placeholder="Código de verificación" />
          <Field label="reCAPTCHA Site Key" name="recaptcha_site_key" placeholder="6L..." />
        </Section>

        <Section title="Redes Sociales">
          <Field label="Facebook URL" name="facebook_url" type="url" />
          <Field label="Instagram URL" name="instagram_url" type="url" />
          <Field label="LinkedIn URL" name="linkedin_url" type="url" />
          <Field label="YouTube URL" name="youtube_url" type="url" />
          <Field label="TikTok URL" name="tiktok_url" type="url" />
          <Field label="WhatsApp (número)" name="whatsapp_number" placeholder="+519XXXXXXXX" />
        </Section>

        <Section title="Hero & Homepage">
          <Field label="Hero Headline" name="hero_headline" />
          <Field label="Hero Subheadline" name="hero_subheadline" />
          <Field label="Newsletter CTA" name="newsletter_cta" />
          <Field label="Footer Text" name="footer_text" />
        </Section>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : '💾 Guardar configuración'}
          </button>
        </div>
      </form>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
