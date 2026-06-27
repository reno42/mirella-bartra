import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { generateMetaTags } from '@/lib/seo.js'

const LEGAL_CONTENT = {
  'aviso-legal': {
    title: 'Aviso Legal',
    content: `Mirella Bartra es una plataforma de medios para terapeutas de lenguaje operada por Mirella Bartra Pérez. Domicilio: Lima, Perú. Contacto: a través del formulario en /contacto.\n\nEsta web tiene fines informativos y educativos. No sustituye consulta profesional personalizada.`,
  },
  'politica-de-privacidad': {
    title: 'Política de Privacidad',
    content: `Recopilamos datos personales (nombre, email) únicamente con tu consentimiento a través de formularios. No compartimos datos con terceros sin autorización expresa.\n\nTus derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) pueden ejercerse en /derechos-arco.\n\nUsamos cookies para analítica (Google Analytics). Puedes rechazarlas en el banner de cookies.`,
  },
  'politica-de-cookies': {
    title: 'Política de Cookies',
    content: `Usamos cookies propias (sesión, seguridad) y de terceros (Google Analytics para medir tráfico).\n\nCookies esenciales: necesarias para el funcionamiento del sitio.\nCookies analíticas: miden uso anónimo para mejorar contenido.\n\nPuedes desactivar cookies en la configuración de tu navegador.`,
  },
  'terminos-y-condiciones': {
    title: 'Términos y Condiciones',
    content: `Al usar este sitio aceptas estos términos. El contenido es propiedad de Mirella Bartra. No se permite reproducción sin autorización.\n\nLos cursos y eventos tienen sus propios términos de inscripción. Los pagos se gestionan mediante depósito bancario.`,
  },
}

export default function Legal() {
  const { slug } = useParams()
  const page = LEGAL_CONTENT[slug] || LEGAL_CONTENT['aviso-legal']

  const meta = generateMetaTags({
    title: page.title,
    description: page.content.slice(0, 160),
    noindex: true,
  })

  return (
    <>
      <Helmet {...meta} />
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <Link to="/" className="back-link">← Volver al inicio</Link>

        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 36px)', marginBottom: '20px' }}>
          {page.title}
        </h1>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {Object.entries(LEGAL_CONTENT).map(([key, val]) => (
            <Link key={key} to={`/legal/${key}`} className={`tag ${slug === key ? '' : 'tag-outline'}`} style={{ textDecoration: 'none' }}>
              {val.title}
            </Link>
          ))}
        </div>

        <div className="article-content" style={{ lineHeight: 1.8 }}>
          {page.content.split('\n\n').map((p, i) => (
            <p key={i} style={{ marginBottom: '16px', fontSize: '14px' }}>{p}</p>
          ))}
        </div>
      </div>
    </>
  )
}
