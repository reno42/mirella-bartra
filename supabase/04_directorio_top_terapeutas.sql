-- ============================================================================
-- DIRECTORIO — Columna is_top + Datos Demo
-- ============================================================================
-- Añade columna para marcar terapeutas como "top recomendados"
-- y los separa visualmente en dos secciones del directorio.
-- ============================================================================

-- ── 1. AÑADIR COLUMNA is_top ─────────────────────────────────────────────────
-- ALTER TABLE de forma segura: IF NOT EXISTS previene error si ya existe

ALTER TABLE directory ADD COLUMN IF NOT EXISTS is_top boolean NOT NULL DEFAULT false;

-- Índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_directory_is_top
  ON directory(is_top)
  WHERE is_top = true AND status = 'published' AND consent_given = true;

-- ── 2. MARCAR ALGUNOS TERAPEUTAS COMO TOP ────────────────────────────────────
-- Solo marca como top a terapeutas ya publicados con consentimiento
-- Si no existen registros demo, no hace nada.

UPDATE directory
SET is_top = true,
    updated_at = now()
WHERE id IN (
  SELECT id FROM directory
  WHERE status = 'published'
    AND consent_given = true
  ORDER BY years_experience DESC NULLS LAST, verified DESC
  LIMIT 4
);

-- ── 3. VERIFICACIÓN ──────────────────────────────────────────────────────────
SELECT
  full_name,
  specialty,
  city,
  is_top,
  verified,
  years_experience
FROM directory
WHERE status = 'published' AND consent_given = true
ORDER BY is_top DESC, full_name;
