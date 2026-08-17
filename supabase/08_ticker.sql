-- ═══════════════════════════════════════════════════════════════════════════
-- Script 08 — Barra superior (ticker): frases configurables desde el intranet
-- Tabla: ticker_messages
--   · Público (anon) lee SOLO las frases activas
--   · Solo usuarios con role = 'admin' crean/editan/eliminan
--   · Las frases ocultas (is_active = false) quedan guardadas como
--     versiones anteriores sin mostrarse en el sitio
-- Re-ejecutable (idempotente)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ticker_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text        text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticker_active_order
  ON ticker_messages(is_active, sort_order);

-- updated_at automático (misma función usada por event_registrations)
DROP TRIGGER IF EXISTS trg_ticker_updated_at ON ticker_messages;
CREATE TRIGGER trg_ticker_updated_at
  BEFORE UPDATE ON ticker_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- Público: leer solo las activas (los admins ven todas, incl. versiones anteriores)
DROP POLICY IF EXISTS "Ticker: public read active" ON ticker_messages;
CREATE POLICY "Ticker: public read active"
  ON ticker_messages FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin: insertar
DROP POLICY IF EXISTS "Ticker: admin insert" ON ticker_messages;
CREATE POLICY "Ticker: admin insert"
  ON ticker_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin: actualizar
DROP POLICY IF EXISTS "Ticker: admin update" ON ticker_messages;
CREATE POLICY "Ticker: admin update"
  ON ticker_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin: eliminar
DROP POLICY IF EXISTS "Ticker: admin delete" ON ticker_messages;
CREATE POLICY "Ticker: admin delete"
  ON ticker_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed inicial: las 3 frases de lanzamiento
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO ticker_messages (text, is_active, sort_order) VALUES
  ('El Primer Medio de Prensa Oficial para Terapeutas', true, 1),
  ('Compatible para IAs y Humanos', true, 2),
  ('Próximos talleres', true, 3)
ON CONFLICT (text) DO NOTHING;
