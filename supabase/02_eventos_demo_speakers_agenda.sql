-- ============================================================================
-- EVENTOS — Columnas Nuevas + Datos Demo con Ponentes y Agenda
-- ============================================================================
-- 1. Añade columnas que el frontend espera (speakers_json, agenda_json, etc.)
-- 2. Inserta/actualiza eventos demo con ponentes y programa
-- ============================================================================

-- ── 1. AÑADIR COLUMNAS FALTANTES A events ───────────────────────────────────
-- El frontend referencia estas columnas que no existen en el schema base

ALTER TABLE events ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PEN';
ALTER TABLE events ADD COLUMN IF NOT EXISTS modality text DEFAULT 'presencial';
ALTER TABLE events ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS speakers_json jsonb DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_json jsonb DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity int;
ALTER TABLE events ADD COLUMN IF NOT EXISTS enrolled_count int DEFAULT 0;

-- Sincronizar title = name donde title sea NULL
UPDATE events SET title = name WHERE title IS NULL;

-- ── 2. INSERTAR/ACTUALIZAR EVENTOS DEMO ─────────────────────────────────────

-- Evento 1: Congreso Internacional
INSERT INTO events (
  name, title, slug, description, content,
  start_date, end_date, city, venue, location, country,
  event_status, is_featured, is_mirella_speaker,
  speaker_role, speaker_topic,
  modality, price, currency, website_url, location_url,
  speakers_json, agenda_json,
  meta_title, meta_description
)
VALUES (
  'III Congreso Internacional de Fonoaudiología y Neurociencia',
  'III Congreso Internacional de Fonoaudiología y Neurociencia',
  'iii-congreso-internacional-fonoaudiologia-neurociencia',
  'El mayor evento de fonoaudiología del año. Tres días de ponencias magistrales, talleres prácticos y networking con expertos internacionales.',
  '<p>El III Congreso Internacional reúne a más de 500 fonoaudiólogos, terapeutas del lenguaje, neurólogos e investigadores de toda Latinoamérica. Este año, el enfoque central será <strong>Neurociencia y Terapia de Lenguaje: Integrando la Evidencia</strong>.</p><p>Incluye certificación por 40 horas lectivas y constancia oficial.</p>',
  '2026-08-15', '2026-08-17',
  'Lima', 'Hotel Los Delfines Convention Center', 'Av. Los Próceres 485, San Borja, Lima', 'Perú',
  'upcoming', true, true,
  'Ponente Principal', 'Neuroplasticidad y Rehabilitación del Lenguaje: Del Laboratorio a la Clínica',
  'presencial', 850.00, 'PEN', 'https://congresofono2026.pe', NULL,
  -- speakers_json: ponentes terceros + del directorio
  '[
    {
      "full_name": "Dra. Elena Vargas",
      "role": "Ponente Internacional",
      "topic": "Neuroimagen funcional en afasia",
      "credentials": "PhD en Neurociencia Cognitiva, Universidad de Barcelona"
    },
    {
      "full_name": "Dr. Roberto Castillo",
      "role": "Investigador Principal",
      "topic": "Biofeedback en disfagia post-extubación",
      "credentials": "Mg. en Fonoaudiología Clínica"
    },
    {
      "full_name": "Lic. Ana Quispe",
      "role": "Especialista en TEA",
      "topic": "Intervención temprana bidireccional",
      "credentials": "Especialista en Trastornos del Espectro Autista"
    },
    {
      "full_name": "Mirella Bartra",
      "role": "Ponente Principal / Organizadora",
      "topic": "Neuroplasticidad y Rehabilitación del Lenguaje",
      "credentials": "Directora de Mirella Bartra Fonoaudiología"
    }
  ]'::jsonb,
  -- agenda_json: programa día por día
  '[
    {"day": "Día 1 - 15 Ago", "time": "08:00", "title": "Acreditación y bienvenida", "speaker": "Comité Organizador"},
    {"day": "Día 1 - 15 Ago", "time": "09:00", "title": "Conferencia Magistral: Neuroplasticidad y Lenguaje", "speaker": "Mirella Bartra"},
    {"day": "Día 1 - 15 Ago", "time": "10:30", "title": "Neuroimagen funcional en afasia", "speaker": "Dra. Elena Vargas"},
    {"day": "Día 1 - 15 Ago", "time": "12:00", "title": "Coffee break & networking", "speaker": ""},
    {"day": "Día 1 - 15 Ago", "time": "13:00", "title": "Mesa redonda: Intervención temprana en TEA", "speaker": "Lic. Ana Quispe"},
    {"day": "Día 2 - 16 Ago", "time": "09:00", "title": "Biofeedback visual en disfagia", "speaker": "Dr. Roberto Castillo"},
    {"day": "Día 2 - 16 Ago", "time": "11:00", "title": "Taller práctico: Evaluación VFSS", "speaker": "Dr. Roberto Castillo"},
    {"day": "Día 2 - 16 Ago", "time": "14:00", "title": "Casos clínicos interactivos", "speaker": "Mirella Bartra"},
    {"day": "Día 3 - 17 Ago", "time": "09:00", "title": "Higiene vocal ocupacional", "speaker": "Dra. Elena Vargas"},
    {"day": "Día 3 - 17 Ago", "time": "11:00", "title": "Panel: Futuro de la fonoaudiología", "speaker": "Todos los ponentes"},
    {"day": "Día 3 - 17 Ago", "time": "13:00", "title": "Clausura y entrega de certificados", "speaker": "Comité Organizador"}
  ]'::jsonb,
  'III Congreso Internacional de Fonoaudiología 2026',
  'Congreso internacional de fonoaudiología y neurociencia. 3 días, 40 horas lectivas, certificación oficial.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  speakers_json = EXCLUDED.speakers_json,
  agenda_json = EXCLUDED.agenda_json,
  is_mirella_speaker = true,
  speaker_role = EXCLUDED.speaker_role,
  speaker_topic = EXCLUDED.speaker_topic;


-- Evento 2: Curso Online
INSERT INTO events (
  name, title, slug, description, content,
  start_date, end_date,
  event_status, is_mirella_speaker, speaker_role,
  modality, price, currency, location_url,
  speakers_json, agenda_json,
  meta_title, meta_description
)
VALUES (
  'Curso Online: Evaluación e Intervención en Trastorno Específico del Lenguaje (TEL)',
  'Curso Online: Evaluación e Intervención en TEL',
  'curso-online-evaluacion-intervencion-tel',
  'Curso virtual asincrónico con sesiones en vivo. Aprende a diagnosticar e intervenir el TEL con herramientas validadas y basadas en evidencia.',
  '<p>Programa de 6 semanas con módulos asincrónicos + 4 sesiones en vivo por Zoom. Incluye manual digital, batería de evaluación y comunidad de práctica.</p>',
  '2026-07-10', '2026-08-20',
  'upcoming', true,
  'Instructora Principal',
  'online', 320.00, 'PEN',
  'https://zoom.us/j/mirella-curso-tel',
  '[
    {
      "full_name": "Mirella Bartra",
      "role": "Instructora Principal",
      "topic": "Marco conceptual y evaluación TEL",
      "credentials": "Fonoaudióloga clínica, 15 años de experiencia"
    },
    {
      "full_name": "Lic. María Fernández",
      "role": "Co-instructora",
      "topic": "Intervención en ámbito escolar",
      "credentials": "Especialista en TEL en contexto educativo"
    }
  ]'::jsonb,
  '[
    {"day": "Semana 1", "time": "Asincrónico", "title": "Módulo 1: Bases neurobiológicas del TEL", "speaker": "Mirella Bartra"},
    {"day": "Semana 2", "time": "Miércoles 19:00", "title": "Sesión en vivo: Evaluación diagnóstica", "speaker": "Mirella Bartra"},
    {"day": "Semana 3", "time": "Asincrónico", "title": "Módulo 2: Intervención fonológica", "speaker": "Mirella Bartra"},
    {"day": "Semana 4", "time": "Miércoles 19:00", "title": "Sesión en vivo: Casos clínicos", "speaker": "Lic. María Fernández"},
    {"day": "Semana 5", "time": "Asincrónico", "title": "Módulo 3: Intervención en ámbito escolar", "speaker": "Lic. María Fernández"},
    {"day": "Semana 6", "time": "Viernes 19:00", "title": "Sesión final + Evaluación", "speaker": "Mirella Bartra"}
  ]'::jsonb,
  'Curso Online TEL - Mirella Bartra',
  'Curso virtual de evaluación e intervención en Trastorno Específico del Lenguaje. 6 semanas, certificación oficial.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  price = EXCLUDED.price,
  speakers_json = EXCLUDED.speakers_json,
  agenda_json = EXCLUDED.agenda_json;


-- Evento 3: Workshop presencial
INSERT INTO events (
  name, title, slug, description, content,
  start_date, end_date, city, venue, location, country,
  event_status, is_mirella_speaker, speaker_role,
  modality, price, currency,
  speakers_json, agenda_json,
  meta_title, meta_description
)
VALUES (
  'Workshop: Terapia Miofuncional Práctica',
  'Workshop: Terapia Miofuncional Práctica',
  'workshop-terapia-miofuncional-practica',
  'Jornada intensiva presencial de terapia miofuncional. Ejercicios prácticos, evaluación clínica y casos reales.',
  '<p>Workshop de un día completo enfocado en la práctica clínica de la terapia miofuncional. Incluye kit de evaluación y materiales.</p>',
  '2026-09-20', '2026-09-20',
  'Arequipa', 'Centro de Convenciones Cerro Juli', 'Av. Aviación s/n, Cerro Juli, Arequipa', 'Perú',
  'upcoming', true,
  'Tallerista Principal',
  'presencial', 180.00, 'PEN',
  '[
    {
      "full_name": "Mirella Bartra",
      "role": "Tallerista Principal",
      "topic": "Evaluación y plan de tratamiento miofuncional",
      "credentials": "Especialista en Motricidad Orofacial"
    },
    {
      "full_name": "Dr. Carlos Mendoza",
      "role": "Invitado Especial",
      "topic": "Interdisciplina: Ortodoncia y Fonoaudiología",
      "credentials": "Ortodoncista, Mg. en Estética Dental"
    }
  ]'::jsonb,
  '[
    {"day": "20 Sep", "time": "08:30", "title": "Acreditación", "speaker": ""},
    {"day": "20 Sep", "time": "09:00", "title": "Anatomía y fisiología orofacial aplicada", "speaker": "Mirella Bartra"},
    {"day": "20 Sep", "time": "10:30", "title": "Evaluación miofuncional: protocolo completo", "speaker": "Mirella Bartra"},
    {"day": "20 Sep", "time": "12:00", "title": "Receso", "speaker": ""},
    {"day": "20 Sep", "time": "13:00", "title": "Interdisciplina: Ortodoncia y Fono", "speaker": "Dr. Carlos Mendoza"},
    {"day": "20 Sep", "time": "14:30", "title": "Práctica: Ejercicios miofuncionales", "speaker": "Mirella Bartra"},
    {"day": "20 Sep", "time": "16:00", "title": "Casos clínicos y discusión", "speaker": "Mirella Bartra"},
    {"day": "20 Sep", "time": "17:30", "title": "Clausura y certificados", "speaker": ""}
  ]'::jsonb,
  'Workshop Terapia Miofuncional - Arequipa 2026',
  'Workshop intensivo de terapia miofuncional. Práctica clínica, evaluación y casos reales.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  speakers_json = EXCLUDED.speakers_json,
  agenda_json = EXCLUDED.agenda_json;


-- Evento 4: Full-Day
INSERT INTO events (
  name, title, slug, description,
  start_date, city, venue, location, country,
  event_status, modality, price, currency,
  speakers_json, agenda_json,
  meta_title
)
VALUES (
  'Full-Day: Actualización en Deglución y Disfagia',
  'Full-Day: Actualización en Deglución y Disfagia',
  'full-day-actualizacion-deglucion-disfagia',
  'Jornada de actualización completa sobre evaluación y manejo de la disfagia orofaríngea.',
  '2026-07-25',
  'Trujillo', 'Hotel Libertador', 'Jirón Bolívar 405, Centro Histórico, Trujillo', 'Perú',
  'upcoming', 'presencial', 120.00, 'PEN',
  '[
    {
      "full_name": "Dr. Roberto Castillo",
      "role": "Ponente",
      "topic": "VFSS y FEES: cuándo y cómo",
      "credentials": "Mg. en Fonoaudiología Clínica"
    },
    {
      "full_name": "Mirella Bartra",
      "role": "Co-organizadora",
      "topic": "Estrategias compensatorias y rehabilitación",
      "credentials": "Fonoaudióloga"
    }
  ]'::jsonb,
  '[
    {"day": "25 Jul", "time": "09:00", "title": "Fisiología de la deglución: revisión", "speaker": "Dr. Roberto Castillo"},
    {"day": "25 Jul", "time": "10:30", "title": "Instrumentación: VFSS vs FEES", "speaker": "Dr. Roberto Castillo"},
    {"day": "25 Jul", "time": "13:00", "title": "Estrategias compensatorias directas", "speaker": "Mirella Bartra"},
    {"day": "25 Jul", "time": "15:00", "title": "Rehabilitación: ejercicios basados en evidencia", "speaker": "Mirella Bartra"},
    {"day": "25 Jul", "time": "17:00", "title": "Discusión de casos", "speaker": "Ambos"}
  ]'::jsonb,
  'Full-Day Deglución y Disfagia - Trujillo'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  speakers_json = EXCLUDED.speakers_json,
  agenda_json = EXCLUDED.agenda_json;


-- Evento 5: Capacitación B2B
INSERT INTO events (
  name, title, slug, description,
  start_date, city, venue, location, country,
  event_status, modality, price, currency,
  speakers_json, agenda_json,
  meta_title
)
VALUES (
  'Capacitación B2B: Comunicación Efectiva en Equipos de Salud',
  'Capacitación B2B: Comunicación Efectiva en Equipos de Salud',
  'capacitacion-b2b-comunicacion-efectiva-equipos-salud',
  'Programa corporativo para clínicas y hospitales. Mejora la comunicación entre profesionales y con pacientes.',
  '2026-10-05',
  'Lima', 'Sede corporativa del cliente', 'A coordinar según institución', 'Perú',
  'upcoming', 'presencial', 2500.00, 'PEN',
  '[
    {
      "full_name": "Mirella Bartra",
      "role": "Facilitadora Principal",
      "topic": "Comunicación clínica efectiva",
      "credentials": "Fonoaudióloga y consultora organizacional"
    }
  ]'::jsonb,
  '[
    {"day": "Sesión 1", "time": "3 horas", "title": "Diagnóstico comunicacional del equipo", "speaker": "Mirella Bartra"},
    {"day": "Sesión 2", "time": "3 horas", "title": "Técnicas de comunicación con pacientes", "speaker": "Mirella Bartra"},
    {"day": "Sesión 3", "time": "3 horas", "title": "Feedback y seguimiento", "speaker": "Mirella Bartra"}
  ]'::jsonb,
  'Capacitación B2B Comunicación - Clínicas'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  speakers_json = EXCLUDED.speakers_json,
  agenda_json = EXCLUDED.agenda_json;


-- ── 3. ÍNDICES PARA NUEVAS COLUMNAS ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_price ON events(price);
CREATE INDEX IF NOT EXISTS idx_events_modality ON events(modality);

-- ── 4. VERIFICACIÓN ─────────────────────────────────────────────────────────
SELECT
  e.title,
  e.start_date,
  e.city,
  e.price,
  e.modality,
  jsonb_array_length(e.speakers_json) AS num_speakers,
  jsonb_array_length(e.agenda_json) AS num_agenda_items
FROM events e
ORDER BY e.start_date;
