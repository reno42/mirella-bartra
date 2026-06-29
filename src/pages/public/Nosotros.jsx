import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { generateMetaTags, generateOrganizationLD } from '@/lib/seo.js'

export default function Nosotros() {
  const meta = generateMetaTags({
    title: 'Nosotros — Equipo Fundador',
    description: 'Conoce al equipo detrás de Mirella Bartra: fonoaudiología, investigación y comunidad profesional.',
    type: 'website',
  })

  const founders = [
    {
      name: 'Mirella Bartra',
      role: 'Co-Fundadora · Fonoaudióloga',
      bio: 'Fonoaudióloga y docente UNFV. Más de 15 años de experiencia clínica en terapia de lenguaje. Especialista en trastornos del habla infantil y neurociencia aplicada.',
      initial: 'M',
    },
    {
      name: 'Founder 2',
      role: 'Co-Fundador · Editorial',
      bio: 'Periodista y editor especializado en salud. Lidera la dirección editorial del medio, asegurando rigor científico y accesibilidad en cada publicación.',
      initial: 'F',
    },
    {
      name: 'Founder 3',
      role: 'Co-Fundador · Tecnología',
      bio: 'Ingeniero de software con foco en productos educativos. Diseña la plataforma tecnológica que conecta a terapeutas, estudiantes y pacientes en toda Latinoamérica.',
      initial: 'F',
    },
  ]

  return (
    <>
      <Helmet {...meta}>
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationLD())}
        </script>
      </Helmet>

      {/* Hero */}
      <section style={{ padding: 'clamp(30px, 6vw, 60px) 0 20px' }}>
        <p className="font-mono" style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Sobre Nosotros
        </p>
        <h1 className="font-display" style={{ fontSize: 'clamp(28px, 7vw, 56px)', lineHeight: 1.05, marginBottom: '16px' }}>
          MISIÓN Y<br />EQUIPO
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', maxWidth: '540px' }}>
          Somos el primer medio de prensa digital dedicado a la fonoaudiología y terapia de lenguaje en Latinoamérica.
          Conectamos evidencia científica con práctica clínica a través de noticias, papers académicos y formación continua.
        </p>
      </section>

      {/* Pillars */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '20px 0',
        marginBottom: '40px',
        display: 'flex',
        gap: 'clamp(20px, 5vw, 60px)',
        flexWrap: 'wrap',
      }}>
        {[
          { value: 'Evidencia', label: 'Cada artículo respaldado por ciencia' },
          { value: 'Comunidad', label: 'Red profesional activa' },
          { value: 'Acceso', label: 'Conocimiento sin barreras' },
        ].map((p) => (
          <div key={p.label}>
            <div className="font-display" style={{ fontSize: '20px', lineHeight: 1 }}>{p.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Founders */}
      <h2 className="section-separator">Equipo Fundador</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {founders.map((f) => (
          <div key={f.name} className="card-brutalist founder-card">
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid var(--text-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              background: 'var(--bg-base)',
              fontFamily: 'var(--font-display)',
              fontSize: '40px',
              color: 'var(--text-dark)',
            }}>
              {f.initial}
            </div>
            <div className="founder-name">{f.name}</div>
            <div className="founder-role">{f.role}</div>
            <p className="founder-bio">{f.bio}</p>
          </div>
        ))}
      </div>

      {/* Manifesto */}
      <section style={{
        padding: 'clamp(25px, 4vw, 40px)',
        border: '1px solid var(--text-dark)',
        borderRadius: '12px',
        marginBottom: '40px',
      }}>
        <h2 className="font-display" style={{ fontSize: 'clamp(20px, 4vw, 28px)', marginBottom: '16px' }}>
          Nuestro Manifiesto
        </h2>
        <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '12px' }}>
            Creemos que el conocimiento científico debe ser accesible para todos los profesionales de la salud,
            sin importar dónde se encuentren. Por eso construimos una plataforma que combina el rigor de una
            revista académica con la inmediatez de un medio de prensa digital.
          </p>
          <p>
            Cada artículo, cada paper, cada curso que publicamos pasa por un filtro de calidad editorial y
            científico. No somos un blog más: somos un medio especializado con estándares periodísticos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: 'clamp(25px, 4vw, 40px)',
        background: 'var(--text-dark)',
        borderRadius: '12px',
        color: 'var(--text-light)',
        textAlign: 'center',
        marginBottom: '40px',
      }}>
        <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 26px)', marginBottom: '10px' }}>
          ¿Quieres formar parte?
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '400px', margin: '0 auto 16px' }}>
          Únete a nuestra comunidad profesional o contáctanos para colaboraciones editoriales.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/directorio/inscribirse" className="btn-accent">Inscribirme al directorio</Link>
          <Link to="/contacto" className="btn-outline" style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}>
            Contactar
          </Link>
        </div>
      </section>
    </>
  )
}
