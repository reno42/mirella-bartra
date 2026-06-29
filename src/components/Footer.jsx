import { Link } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    title: 'Contenido',
    links: [
      { label: 'Noticias', to: '/articulos' },
      { label: 'Papers Académicos', to: '/papers' },
      { label: 'Congresos', to: '/congresos' },
      { label: 'Descuentos', to: '/descuentos' },
      { label: 'Descargables', to: '/descargables' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { label: 'Directorio', to: '/directorio' },
      { label: 'Nosotros', to: '/nosotros' },
      { label: 'Capacitaciones B2B', to: '/capacitaciones-b2b' },
      { label: 'Trabaja con Nosotros', to: '/trabaja-con-nosotros' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Contacto', to: '/contacto' },
      { label: 'Libro de Reclamaciones', to: '/libro-reclamaciones' },
      { label: 'Derechos ARCO', to: '/derechos-arco' },
      { label: 'Aviso Legal', to: '/legal/aviso-legal' },
      { label: 'Privacidad', to: '/legal/politica-de-privacidad' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="footer-col">
              <h3 className="font-mono" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-muted)' }}>
                {section.title}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.to} style={{ marginBottom: '6px' }}>
                    <Link to={link.to} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-col">
            <h3 className="font-mono" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-muted)' }}>
              Mirella Bartra
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Fonoaudióloga peruana, docente en la UNFV. Especialista en terapia de lenguaje, habla, voz y deglución.
              Primera plataforma de medios para terapeutas del continente.
            </p>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Mirella Bartra. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          border-top: 1px solid var(--border-color);
          padding: 40px 0 30px;
          margin-top: 60px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 30px;
        }
        .footer-link {
          font-size: 12px;
          color: var(--text-dark);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .footer-link:hover {
          color: var(--text-muted);
          text-decoration: underline;
        }
      `}</style>
    </footer>
  )
}
