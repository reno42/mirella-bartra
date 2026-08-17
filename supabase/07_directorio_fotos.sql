-- ============================================================================
-- 07_directorio_fotos.sql
-- Fotos de terapeutas del directorio
--   - Columna photo_url en directory (URL pública de Supabase Storage)
--   - Política de storage para que el formulario público suba fotos
--     solo a la carpeta 'directorio/' del bucket 'media'
-- Script re-ejecutable.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A. COLUMNA photo_url
-- ═══════════════════════════════════════════════════════════════════════════
-- Se guarda la URL pública directamente (el bucket 'media' es público de
-- lectura). El admin también puede subirla desde el intranet.

ALTER TABLE directory ADD COLUMN IF NOT EXISTS photo_url text;

COMMENT ON COLUMN directory.photo_url IS
  'URL pública de la foto del terapeuta (bucket media/, carpeta directorio/)';

-- ═══════════════════════════════════════════════════════════════════════════
-- B. STORAGE: uploads públicos acotados a media/directorio/
-- ═══════════════════════════════════════════════════════════════════════════
-- Permite que el formulario de inscripción (visitante sin cuenta) suba su
-- foto SIN exponer el bucket completo: solo puede escribir en la subcarpeta
-- 'directorio/'. El formulario está protegido con reCAPTCHA.

DROP POLICY IF EXISTS "Directorio: public photo upload" ON storage.objects;
CREATE POLICY "Directorio: public photo upload"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'directorio'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- C. VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'directory' AND column_name = 'photo_url';
