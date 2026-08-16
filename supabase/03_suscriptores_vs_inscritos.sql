-- ============================================================================
-- SUSCRIPTORES vs INSCRITOS A EVENTOS — Schema con Diferenciación
-- ============================================================================
-- Problema: La tabla `subscribers` mezcla dos audiencias distintas:
--   1. Suscriptores del newsletter (quieren recibir noticias)
--   2. Inscritos a eventos (se registraron para asistir a un congreso/curso)
--
-- Solución:
--   A. Mejorar `subscribers` con tipo de suscripción
--   B. Crear `event_registrations` para inscripciones a eventos
--   C. Vista unificada para el panel de administración
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A. MEJORAR TABLA subscribers
-- ═══════════════════════════════════════════════════════════════════════════

-- Tipo de suscriptor
DO $$ BEGIN
  CREATE TYPE subscriber_type AS ENUM (
    'newsletter',        -- suscriptor del boletín de noticias
    'event_alert',       -- quiere alertas de eventos
    'both',              -- newsletter + alertas de eventos
    'lead_magnet'        -- descargó un recurso gratuito
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Añadir columna de tipo (backward-compatible: los existentes son 'newsletter')
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS subscriber_type subscriber_type DEFAULT 'newsletter';

-- Añadir campos útiles para segmentación
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT false;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_date timestamptz;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS engagement_score int DEFAULT 0;

-- Migrar existentes: los que vinieron de 'web' son newsletter por defecto
UPDATE subscribers
SET subscriber_type = 'newsletter'
WHERE subscriber_type IS NULL;

-- Asegurar que source sea más específico
DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'newsletter_cta';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'event_registration';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'therapist_contact';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- B. CREAR TABLA event_registrations
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS event_registrations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  subscriber_id   uuid REFERENCES subscribers(id) ON DELETE SET NULL,

  -- Datos del inscrito
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  profession      text,
  institution     text,
  document_number text,                -- DNI/CE para certificados

  -- Estado de inscripción
  registration_status text NOT NULL DEFAULT 'pending'
    CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')),

  -- Pago
  amount_paid     numeric(10,2) DEFAULT 0,
  payment_method  text,                -- stripe, yape, plin, transferencia, deposit
  payment_ref     text,
  payment_status  text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'free')),

  -- Metadata
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  notes           text,

  -- Confirmación
  confirmed_at    timestamptz,
  confirmed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Check-in
  checked_in_at   timestamptz,
  checked_in_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_reg_status ON event_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_event_reg_payment ON event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_reg_subscriber ON event_registrations(subscriber_id);

-- RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Público: cualquiera puede inscribirse
CREATE POLICY "Event_registrations: public insert"
  ON event_registrations FOR INSERT
  WITH CHECK (true);

-- Solo el propio inscrito puede ver su registro (por email match en auth)
CREATE POLICY "Event_registrations: self read"
  ON event_registrations FOR SELECT
  USING (
    auth.email() = email
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Admins/editors: lectura y gestión total
CREATE POLICY "Event_registrations: admin read"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Event_registrations: admin update"
  ON event_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Event_registrations: admin delete"
  ON event_registrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Trigger updated_at
CREATE TRIGGER trg_event_reg_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- C. FUNCIÓN: Auto-crear subscriber al inscribirse a evento
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_create_subscriber_on_registration()
RETURNS trigger AS $$
BEGIN
  -- Si ya existe un subscriber con ese email, linkear
  UPDATE subscribers
  SET subscriber_type = CASE
    WHEN subscriber_type IN ('newsletter', 'event_alert', 'lead_magnet') THEN 'both'
    ELSE subscriber_type
  END,
  updated_at = now()
  WHERE email = NEW.email;

  -- Si no existe, crearlo como event_alert
  IF NOT FOUND THEN
    INSERT INTO subscribers (email, full_name, subscriber_type, source, profession, city)
    VALUES (NEW.email, NEW.full_name, 'event_alert', 'event_registration', NEW.profession, NULL)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO NEW.subscriber_id;
  ELSE
    SELECT id INTO NEW.subscriber_id FROM subscribers WHERE email = NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_subscriber ON event_registrations;
CREATE TRIGGER trg_auto_subscriber
  BEFORE INSERT ON event_registrations
  FOR EACH ROW
  WHEN (NEW.subscriber_id IS NULL)
  EXECUTE FUNCTION auto_create_subscriber_on_registration();

-- ═══════════════════════════════════════════════════════════════════════════
-- D. VISTA: Audiencia unificada para el panel de administración
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_audiencia_unificada AS
SELECT
  'newsletter' AS origen,
  s.id,
  s.email,
  s.full_name,
  s.subscriber_type,
  s.profession,
  s.city,
  s.source,
  s.is_active,
  s.engagement_score,
  s.subscribed_at AS fecha_registro,
  NULL::text AS evento_asociado,
  NULL::text AS estado_inscripcion,
  NULL::text AS estado_pago
FROM subscribers s

UNION ALL

SELECT
  'event_registration' AS origen,
  er.id,
  er.email,
  er.full_name,
  'event_alert' AS subscriber_type,
  er.profession,
  NULL::text AS city,
  'event_registration' AS source,
  true AS is_active,
  0 AS engagement_score,
  er.created_at AS fecha_registro,
  e.title AS evento_asociado,
  er.registration_status AS estado_inscripcion,
  er.payment_status AS estado_pago
FROM event_registrations er
LEFT JOIN events e ON er.event_id = e.id
ORDER BY fecha_registro DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- E. ÍNDICES ADICIONALES EN subscribers
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_subscribers_type ON subscribers(subscriber_type);
CREATE INDEX IF NOT EXISTS idx_subscribers_profession ON subscribers(profession);
CREATE INDEX IF NOT EXISTS idx_subscribers_marketing ON subscribers(consent_marketing) WHERE consent_marketing = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- F. DATOS DEMO
-- ═══════════════════════════════════════════════════════════════════════════

-- Newsletter subscribers demo
INSERT INTO subscribers (email, full_name, subscriber_type, source, profession, city, consent_marketing, consent_date, subscribed_at)
VALUES
  ('dra.elena.vargas@fono.pe', 'Dra. Elena Vargas', 'newsletter', 'web', 'Fonoaudióloga', 'Lima', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('lic.ana.quispe@gmail.com', 'Lic. Ana Quispe', 'newsletter', 'newsletter_cta', 'Terapeuta de Lenguaje', 'Cusco', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('dr.roberto.castillo@clinica.pe', 'Dr. Roberto Castillo', 'both', 'event_registration', 'Fonoaudiólogo', 'Arequipa', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('maria.fernandez@edu.pe', 'Lic. María Fernández', 'newsletter', 'web', 'Fonoaudióloga Escolar', 'Trujillo', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('carlos.mendoza@odontope.com', 'Dr. Carlos Mendoza', 'event_alert', 'newsletter_cta', 'Ortodoncista', 'Lima', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days')
ON CONFLICT (email) DO UPDATE SET
  subscriber_type = EXCLUDED.subscriber_type,
  profession = EXCLUDED.profession,
  city = EXCLUDED.city;

-- ═══════════════════════════════════════════════════════════════════════════
-- G. VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

-- Resumen de audiencia por tipo
SELECT
  subscriber_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active = true) AS activos
FROM subscribers
GROUP BY subscriber_type
ORDER BY total DESC;

-- Resumen de inscripciones a eventos
SELECT
  e.title AS evento,
  COUNT(er.id) AS inscripciones,
  COUNT(er.id) FILTER (WHERE er.registration_status = 'confirmed') AS confirmadas,
  COUNT(er.id) FILTER (WHERE er.payment_status = 'paid') AS pagadas
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.title
ORDER BY inscripciones DESC;
