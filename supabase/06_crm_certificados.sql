-- ============================================================================
-- 06_crm_certificados.sql
-- Certificates table + CRM unified timeline views
-- Prerequisite: 03_suscriptores_vs_inscritos.sql (event_registrations)
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A. COMPATIBILITY COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════
-- Frontend inserts leads with "name" (Contacto, popup, forms) while base
-- schema defines full_name. Add "name" if missing and backfill it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'name'
  ) THEN
    ALTER TABLE leads ADD COLUMN "name" text;
    UPDATE leads SET "name" = full_name WHERE "name" IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE subscribers ADD COLUMN full_name text;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- B. CERTIFICATES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS certificates (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        uuid REFERENCES events(id) ON DELETE SET NULL,
  event_title     text NOT NULL,
  person_name     text NOT NULL,
  person_email    text,
  document_number text,
  hours           numeric(5,1),
  certificate_code text UNIQUE,
  source          text DEFAULT 'evento',          -- evento | manual | csv
  generated_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_event ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates(person_email);
CREATE INDEX IF NOT EXISTS idx_certificates_created ON certificates(created_at DESC);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Admin/editor: leer
CREATE POLICY "Certificates: admin read"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Admin: insertar (generación en lote)
CREATE POLICY "Certificates: admin insert"
  ON certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- C. CRM VIEWS — Timeline unificado de contactos
-- ═══════════════════════════════════════════════════════════════════════════
-- v_crm_timeline: una fila por interacción de un contacto.
--   Tipos: subscription | lead_form | course_enroll | event_register | certificate

DO $$
DECLARE
  has_event_regs boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_registrations'
  ) INTO has_event_regs;

  EXECUTE format('
    CREATE OR REPLACE VIEW v_crm_timeline AS
    SELECT
      s.email                        AS contact_email,
      s.full_name                    AS contact_name,
      ''subscription''               AS activity_type,
      s.subscribed_at                AS activity_date,
      ''Suscripción al newsletter''
        || CASE WHEN s.source::text IS NOT NULL
           THEN '' · origen: '' || s.source::text ELSE '''' END
                                     AS detail
    FROM subscribers s
    WHERE s.email IS NOT NULL

    UNION ALL

    SELECT
      l.email                        AS contact_email,
      COALESCE(l."name", l.full_name) AS contact_name,
      ''lead_form''                  AS activity_type,
      l.created_at                   AS activity_date,
      ''Dejó sus datos''
        || CASE WHEN l.source::text IS NOT NULL
           THEN '' · '' || l.source::text ELSE '''' END
        || CASE WHEN l.message IS NOT NULL AND LENGTH(l.message) > 0
           THEN '' — '' || LEFT(l.message, 120) ELSE '''' END
                                     AS detail
    FROM leads l
    WHERE l.email IS NOT NULL

    UNION ALL

    SELECT
      ce.email                       AS contact_email,
      ce.full_name                   AS contact_name,
      ''course_enroll''              AS activity_type,
      ce.enrolled_at                 AS activity_date,
      ''Inscripción a curso''
        || CASE WHEN c.title IS NOT NULL
           THEN '': '' || c.title ELSE '''' END
                                     AS detail
    FROM course_enrollments ce
    LEFT JOIN courses c ON ce.course_id = c.id
    WHERE ce.email IS NOT NULL

    %s

    UNION ALL

    SELECT
      cert.person_email              AS contact_email,
      cert.person_name               AS contact_name,
      ''certificate''                AS activity_type,
      cert.created_at                AS activity_date,
      ''Certificado emitido: '' || cert.event_title
        || CASE WHEN cert.certificate_code IS NOT NULL
           THEN '' ('' || cert.certificate_code || '')'' ELSE '''' END
                                     AS detail
    FROM certificates cert
    WHERE cert.person_email IS NOT NULL;
  ',
  CASE WHEN has_event_regs THEN
    'UNION ALL

    SELECT
      er.email                       AS contact_email,
      er.full_name                   AS contact_name,
      ''event_register''             AS activity_type,
      er.created_at                  AS activity_date,
      ''Inscripción a evento''
        || CASE WHEN e.name IS NOT NULL
           THEN '': '' || e.name ELSE '''' END
        || CASE WHEN er.registration_status IS NOT NULL
           THEN '' ['' || er.registration_status || '']'' ELSE '''' END
                                     AS detail
    FROM event_registrations er
    LEFT JOIN events e ON er.event_id = e.id
    WHERE er.email IS NOT NULL'
  ELSE '-- event_registrations no existe aún (ejecutar 03)' END
  );
END $$;

-- v_crm_contacts: un contacto por email con resumen de actividad
CREATE OR REPLACE VIEW v_crm_contacts AS
SELECT
  t.contact_email,
  MAX(t.contact_name) FILTER (WHERE t.contact_name IS NOT NULL) AS contact_name,
  COUNT(*)                                                    AS total_activities,
  STRING_AGG(DISTINCT t.activity_type, ',')                   AS activity_types,
  MIN(t.activity_date)                                        AS first_activity,
  MAX(t.activity_date)                                        AS last_activity
FROM v_crm_timeline t
GROUP BY t.contact_email;

-- ═══════════════════════════════════════════════════════════════════════════
-- D. VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

-- Contactos con más interacciones
SELECT contact_name, contact_email, total_activities, activity_types
FROM v_crm_contacts
ORDER BY total_activities DESC
LIMIT 20;

-- Últimas 20 interacciones registradas
SELECT contact_email, activity_type, detail, activity_date
FROM v_crm_timeline
ORDER BY activity_date DESC
LIMIT 20;
