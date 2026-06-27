import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { db, storage, supabase } from '@/lib/supabase.js'
import { formatDate } from '@/utils/dateUtils.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

const BUCKET = 'media'

export default function Media() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [preview, setPreview] = useState(null)

  const fetchMedia = () => {
    setLoading(true)
    db.getMedia().then(({ data }) => setFiles(data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchMedia() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
    if (!allowed.includes(file.type)) {
      showToast('Formato no permitido. Usa JPG, PNG, WEBP, GIF, SVG o PDF.', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('El archivo excede 10MB.', 'error')
      return
    }

    setUploading(true)
    const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error: uploadError } = await storage.uploadFile(BUCKET, file, path)

    if (uploadError) {
      showToast('Error al subir: ' + uploadError.message, 'error')
      setUploading(false)
      return
    }

    const publicUrl = storage.getPublicUrl(BUCKET, path)

    // Insert media record
    const { error: dbError } = await supabase.from('media').insert({
      file_name: file.name,
      file_path: path,
      public_url: publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
    })

    if (dbError) {
      showToast('Archivo subido pero error al registrar: ' + dbError.message, 'error')
    } else {
      showToast('Archivo subido correctamente')
      fetchMedia()
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.file_name}"?`)) return
    await storage.deleteFile(BUCKET, item.file_path)
    const { error } = await supabase.from('media').delete().eq('id', item.id)
    if (error) { showToast('Error al eliminar', 'error') }
    else { showToast('Archivo eliminado'); fetchMedia() }
  }

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
    showToast('URL copiada al portapapeles')
  }

  const isImage = (mime) => mime?.startsWith('image/')

  return (
    <>
      <Helmet><title>Media | Mirella Admin</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="font-display" style={{ fontSize: '24px' }}>Media</h1>
        <label className="btn-accent btn-small" style={{ cursor: 'pointer', position: 'relative' }}>
          {uploading ? 'Subiendo...' : '+ Subir archivo'}
          <input type="file" accept="image/*,.pdf" onChange={handleUpload} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} disabled={uploading} />
        </label>
      </div>

      {loading ? <LoadingSpinner /> : files.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay archivos en la biblioteca. Sube el primero.</p>
      ) : (
        <div className="grid-auto-fill">
          {files.map(f => (
            <div key={f.id} className="card-brutalist" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Preview */}
              <div
                style={{
                  height: '160px',
                  background: 'var(--bg-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isImage(f.mime_type) ? 'pointer' : 'default',
                  overflow: 'hidden',
                }}
                onClick={() => isImage(f.mime_type) && setPreview(f)}
              >
                {isImage(f.mime_type) ? (
                  <img
                    src={f.public_url}
                    alt={f.file_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '4px' }}>📄</div>
                    {f.mime_type}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.3 }}>{f.file_name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {(f.size_bytes / 1024).toFixed(1)} KB · {formatDate(f.created_at)}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
                  <button className="btn-outline btn-small" onClick={() => copyUrl(f.public_url)} style={{ flex: 1, justifyContent: 'center', fontSize: '10px' }}>Copiar URL</button>
                  <button className="btn-outline btn-small" onClick={() => handleDelete(f)} style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '10px' }}>X</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'pointer' }}
          onClick={() => setPreview(null)}
        >
          <img
            src={preview.public_url}
            alt={preview.file_name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
          <button
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', color: 'black', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontWeight: 700, cursor: 'pointer', fontSize: '16px' }}
            onClick={() => setPreview(null)}
          >✕</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
