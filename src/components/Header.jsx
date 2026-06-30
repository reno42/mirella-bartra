import { Link, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/supabase.js'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [session, setSession] = useState(null)
  const location = useLocation()

  useEffect(() => {
    auth.getSession().then(({ session }) => setSession(session))
  }, [])

  const linkClass = ({ isActive }) =>
    `header-link ${isActive ? 'header-link-active' : ''}`

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          <span className="font-display" style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', letterSpacing: '0.05em' }}>
            MIRELLA BARTRA
          </span>
        </Link>

        <button
          className="header-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>Inicio</NavLink>
          <NavLink to="/articulos" className={linkClass} onClick={() => setMenuOpen(false)}>Noticias</NavLink>
          <NavLink to="/papers" className={linkClass} onClick={() => setMenuOpen(false)}>Papers</NavLink>
          <NavLink to="/congresos" className={linkClass} onClick={() => setMenuOpen(false)}>Congresos</NavLink>
          <NavLink to="/directorio" className={linkClass} onClick={() => setMenuOpen(false)}>Directorio</NavLink>
          <NavLink to="/nosotros" className={linkClass} onClick={() => setMenuOpen(false)}>Nosotros</NavLink>
          <NavLink to="/contacto" className={linkClass} onClick={() => setMenuOpen(false)}>Contacto</NavLink>

          {session ? (
            <Link to="/admin" className="btn-primary btn-small" style={{ marginLeft: '8px' }}>
              Admin
            </Link>
          ) : (
            <Link to="/login" className="btn-outline btn-small" style={{ marginLeft: '8px' }}>
              Ingresar
            </Link>
          )}
        </nav>

        <div className={`header-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      </div>

      <style>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-base);
          border-bottom: 1px solid var(--border-color);
          padding: 8px 0;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-logo {
          text-decoration: none;
          color: var(--text-dark);
        }
        .header-logo span {
          display: block;
        }
        .header-nav {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .header-link {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--text-dark);
          padding: 6px 12px;
          border-radius: 6px;
          transition: var(--transition-fast);
        }
        .header-link:hover {
          background: var(--text-dark);
          color: var(--text-light);
        }
        .header-link-active {
          background: var(--text-dark);
          color: var(--text-light);
        }
        .header-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--text-dark);
          transition: var(--transition-fast);
        }
        .hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        .header-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: -1;
        }
        @media (max-width: 768px) {
          .header-menu-btn { display: block; }
          .header-nav {
            display: none;
            position: fixed;
            top: 56px;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-base);
            flex-direction: column;
            padding: 20px;
            gap: 8px;
            z-index: 101;
          }
          .header-nav.open { display: flex; }
          .header-overlay.open { display: block; }
          .header-link { font-size: 14px; padding: 12px 16px; width: 100%; }
          .header-link-active { background: var(--text-dark); color: var(--text-light); }
        }
      `}</style>
    </header>
  )
}
