-- ============================================================================
-- PAPERS ACADÉMICOS — Datos Demo
-- ============================================================================
-- Inserta artículos con "articleSection" = 'Papers Académicos'
-- para que aparezcan en la página /papers
-- ============================================================================

-- ── 0. AÑADIR COLUMNAS QUE EL FRONTEND USA PERO NO ESTÁN EN EL SCHEMA BASE ──
-- El schema original tiene category_id (FK), pero el frontend usa
-- "articleSection" y category como campos de texto plano.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS "articleSection" text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS keywords text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image text;  -- URL directa (no UUID)

-- Asegurar que existe una categoría de Papers/Investigación
INSERT INTO categories (name, slug, description, sort_order)
VALUES ('Papers Académicos', 'papers-academicos', 'Investigación y papers académicos de fonoaudiología', 75)
ON CONFLICT (slug) DO NOTHING;

-- Insertar papers académicos demo
INSERT INTO articles (title, slug, subtitle, excerpt, content, status, "articleSection", category, is_featured, published_at, reading_time, author_name)
VALUES
(
  'Eficacia de la Terapia de Articulación en Niños con Trastorno Fonológico',
  'eficacia-terapia-articulacion-trastorno-fonologico',
  'Un meta-análisis de 24 estudios controlados',
  'Este meta-análisis examina la efectividad de las intervenciones de terapia de articulación en niños de 3 a 7 años con trastorno fonológico, evidenciando mejoras significativas en la inteligibilidad del habla.',
  '<h2>Resumen</h2><p>El presente estudio realiza un meta-análisis de 24 ensayos controlados aleatorizados que evaluaron la eficacia de distintas intervenciones de terapia de articulación en niños con trastorno fonológico (TF). Se analizaron datos de 1,847 participantes entre 3 y 7 años.</p><h2>Metodología</h2><p>Se realizaron búsquedas sistemáticas en PubMed, Scopus, ERIC y SciELO hasta diciembre 2025. Los criterios de inclusión requirieron: diagnóstico confirmado de TF, intervención basada en terapia de articulación, y medición pre-post con escalas validadas (Goldman-Fristoe Test of Articulation, DEAP).</p><h2>Resultados</h2><p>El tamaño del efecto promedio fue <strong>d = 0.78</strong> (IC 95%: 0.62–0.94), indicando una mejora significativa en la producción correcta de fonemas. Las intervenciones con enfoque fonológico–metafonológico mostraron mayor efectividad (d = 0.92) frente a las tradicionales de articulación pura (d = 0.61).</p><h2>Conclusión</h2><p>La terapia de articulación es efectiva para el tratamiento del TF en niños preescolares y escolares. Se recomienda integrar componentes metafonológicos para maximizar resultados.</p>',
  'published',
  'Papers Académicos',
  'Lenguaje',
  true,
  NOW() - INTERVAL '5 days',
  8,
  'Bartra, M.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (title, slug, subtitle, excerpt, content, status, "articleSection", category, published_at, reading_time, author_name)
VALUES
(
  'Neuroplasticidad y Rehabilitación del Lenguaje en Pacientes Post-AVC',
  'neuroplasticidad-rehabilitacion-lenguaje-post-avc',
  'Mapeo de redes neuronales durante la recuperación del lenguaje',
  'Estudio de neuroimagen funcional que documenta la reorganización cortical en pacientes con afasia post-accidente cerebrovascular durante 12 semanas de terapia.',
  '<h2>Introducción</h2><p>La afasia post-AVC afecta aproximadamente al 30% de los sobrevivientes. Este estudio longitudinal investigó los cambios en la conectividad neural mediante fMRI durante un programa intensivo de terapia de lenguaje.</p><h2>Métodos</h2><p>Se reclutaron 42 pacientes con afasia crónica (6–24 meses post-AVC). Se realizaron sesiones de terapia de 90 minutos, 5 veces por semana, durante 12 semanas. Se obtuvieron imágenes fMRI en tres puntos temporales: basal, semana 6 y semana 12.</p><h2>Resultados clave</h2><ul><li>Aumento del 34% en activación del giro frontal inferior izquierdo</li><li>Fortalecimiento de la conectividad fronto-temporal</li><li>Reclutamiento compensatorio del hemisferio derecho en 68% de los pacientes</li><li>Correlación positiva entre intensidad terapéutica y recuperación funcional (r = 0.71)</li></ul><h2>Implicancias clínicas</h2><p>Los hallazgos sugieren que la ventana de plasticidad post-AVC puede extenderse más allá de los 6 meses, respaldando intervenciones intensivas incluso en afasia crónica.</p>',
  'published',
  'Papers Académicos',
  'Neurociencia',
  NOW() - INTERVAL '12 days',
  11,
  'Bartra, M. y Castillo, R.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (title, slug, subtitle, excerpt, content, status, "articleSection", category, published_at, reading_time, author_name)
VALUES
(
  'Intervención Temprana en Riesgo de TEA: Evaluación de un Programa Bidireccional',
  'intervencion-temprana-riesgo-tea-programa-bidireccional',
  'Comunicación parental y respuesta infantil en niños de 12-24 meses',
  'Ensayo controlado que evalúa un programa de intervención temprana bidireccional para mejorar la comunicación en lactantes con alto riesgo de trastorno del espectro autista.',
  '<h2>Objetivo</h2><p>Evaluar la efectividad de un programa de intervención bidireccional (padres-niño) en el desarrollo comunicativo de lactantes con alto riesgo genético de TEA.</p><h2>Diseño</h2><p>Ensayo controlado aleatorizado con 68 lactantes (12–24 meses) con alto riesgo familiar de TEA. Grupo experimental: 12 sesiones semanales de entrenamiento parental en estrategias de respuesta contingente y regulación interactiva. Grupo control: seguimiento estándar.</p><h2>Resultados</h2><p>Los niños del grupo experimental mostraron:</p><ul><li>Aumento significativo en vocalizaciones comunicativas (+47%)</li><li>Mejor contacto visual sostenido (p < 0.001)</li><li>Reducción de conductas repetitivas a los 18 meses</li><li>Diagnóstico de TEA a los 36 meses: 18% vs 35% en control</li></ul><h2>Discusión</h2><p>La intervención temprana centrada en la bidireccionalidad comunicativa puede modificar trayectorias de desarrollo en población de alto riesgo, justificando programas de cribado universal a los 12 meses.</p>',
  'published',
  'Papers Académicos',
  'Lenguaje',
  NOW() - INTERVAL '20 days',
  9,
  'Bartra, M., Fernández, L. y Quispe, A.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (title, slug, subtitle, excerpt, content, status, "articleSection", category, published_at, reading_time, author_name)
VALUES
(
  'Biofeedback Visual en el Tratamiento de la Disfagia Orofaríngea Post-Extubación',
  'biofeedback-visual-disfagia-orofaringea-post-extubacion',
  'Eficacia de la terapia con visualización en tiempo real',
  'Estudio prospectivo que evalúa el uso de biofeedback visual mediante endoscopia para la rehabilitación de la deglución en pacientes post-UCU.',
  '<h2>Contexto</h2><p>La disfagia orofaríngea afecta al 60–80% de pacientes post-extubación prolongada. Este estudio evalúa la eficacia de un protocolo de biofeedback visual en tiempo real como complemento a la terapia convencional.</p><h2>Metodología</h2><p>Se asignaron aleatoriamente 55 pacientes post-extubación (> 7 días de VM) a dos grupos: terapia convencional (TC) o TC + biofeedback visual (BF-V). Las evaluaciones se realizaron mediante la Escala de Penetración-Aspiración (PAS) y el MASA-C.</p><h2>Resultados</h2><table><tr><th>Variable</th><th>Grupo TC</th><th>Grupo BF-V</th><th>p</th></tr><tr><td>Mejora PAS</td><td>-1.8</td><td>-3.4</td><td>0.002</td></tr><tr><td>Días a dieta oral</td><td>14.3</td><td>8.7</td><td><0.001</td></tr><tr><td>Neumonía aspirativa</td><td>15%</td><td>4%</td><td>0.03</td></tr></table><h2>Conclusión</h2><p>El biofeedback visual acelera significativamente la recuperación de la deglución segura y reduce complicaciones respiratorias en pacientes post-extubación.</p>',
  'published',
  'Papers Académicos',
  'Deglución',
  NOW() - INTERVAL '28 days',
  10,
  'Castillo, R. y Bartra, M.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (title, slug, subtitle, excerpt, content, status, "articleSection", category, published_at, reading_time, author_name)
VALUES
(
  'Programa de Higiene Vocal en Docentes: Resultados de un Estudio Multicéntrico',
  'programa-higiene-vocal-docentes-multicentrico',
  'Prevención de disfonía ocupacional en profesores',
  'Investigación multicéntrica con 480 docentes que evalúa un programa preventivo de higiene vocal durante un año académico completo.',
  '<h2>Propósito</h2><p>Determinar la efectividad de un programa estructurado de higiene vocal en la prevención de disfonía ocupacional en docentes de educación básica.</p><h2>Métodos</h2><p>Estudio cuasi-experimental multicéntrico con 480 docentes de 12 instituciones educativas. El programa incluyó: talleres de técnica vocal, pausas vocales programadas, hidratación y ejercicios de calentamiento/enfriamiento. Evaluación con VHI-10 y análisis acústico (MDVP).</p><h2>Resultados</h2><ul><li>Reducción del 42% en la incidencia de disfonía (vs control histórico)</li><li>Mejora en jitter (p=0.001) y shimmer (p=0.003)</li><li>Satisfacción docente con el programa: 91%</li><li>Reducción de licencias médicas por problemas vocales: 58%</li></ul><h2>Recomendaciones</h2><p>Los programas de higiene vocal deberían implementarse de forma obligatoria en instituciones educativas con alta carga horaria docente. La periodicidad óptima sugerida es de sesiones mensuales de refuerzo.</p>',
  'published',
  'Papers Académicos',
  'Voz',
  NOW() - INTERVAL '35 days',
  7,
  'Bartra, M. y Instituto de Voz Peruano'
)
ON CONFLICT (slug) DO NOTHING;

-- Verificación
SELECT title, "articleSection", published_at
FROM articles
WHERE "articleSection" = 'Papers Académicos'
ORDER BY published_at DESC;
