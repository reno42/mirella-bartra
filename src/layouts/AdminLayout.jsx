import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/supabase.js'

const SIDEBAR_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/articulos', label: 'Artículos', icon: '📝' },
  { to: '/admin/cursos', label: 'Cursos', icon: '🎓' },
  { to: '/admin/eventos', label: 'Eventos', icon: '📅' },
  { to: '/admin/directorio', label: 'Directorio', icon: '👥' },
  { to: '/admin/leads', label: 'Leads', icon: '📧' },
  { to: '/admin/subscribers', label: 'Suscriptores', icon: '📬' },
  { to: '/admin/faqs', label: 'FAQs', icon: '❓' },
  { to: '/admin/testimonials', label: 'Testimonios', icon: '⭐' },
  { to: '/admin/complaints', label: 'Reclamos', icon: '📋' },
  { to: '/admin/media', label: 'Media', icon: '🖼️' },
  { to: '/admin/bidding', label: 'Pujas', icon: '🏆' },
  { to: '/admin/deposits', label: 'Depósitos', icon: '💰' },
  { to: '/admin/b2b', label: 'B2B', icon: '🏢' },
  { to: '/admin/config', label: 'Config', icon: '⚙️' },
  { to: '/admin/users', label: 'Usuarios', icon: '🔑' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    auth.getCurrentUser().then(({ user }) => setUser(user))
  }, [])

  const handleLogout = async () => {
    await auth.signOut()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      {/* Top Bar */}
      <div className="admin-topbar">
        <button className="admin-menu-trigger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menú">
          <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>
        <Link to="/admin" className="font-display" style={{ fontSize: '14px', textDecoration: 'none', color: 'var(--text-dark)' }}>
          MIRELLA ADMIN
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</span>
          <Link to="/" className="btn-outline btn-small" target="_blank">Ver sitio</Link>
          <button className="btn-primary btn-small" onClick={handleLogout}>Salir</button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="admin-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        <div
          className={`admin-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      <style>{`
        .admin-layout { min-height: 100vh; background: var(--bg-base); }
        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          border-bottom: 1px solid var(--border-color);
          background: var(--text-light);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .admin-menu-trigger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        .admin-sidebar {
          width: 220px;
          min-width: 220px;
          border-right: 1px solid var(--border-color);
          background: var(--text-light);
          padding: 12px 0;
          overflow-y: auto;
        }
        .admin-nav { display: flex; flex-direction: column; }
        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          color: var(--text-dark);
          transition: var(--transition-fast);
        }
        .admin-nav-link:hover { background: rgba(0,0,0,0.05); }
        .admin-nav-link.active {
          background: var(--text-dark);
          color: var(--text-light);
        }
        .admin-nav-icon { font-size: 16px; width: 22px; text-align: center; }
        .admin-overlay { display: none; }
        .admin-main {
          flex: 1;
          padding: 24px;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .admin-menu-trigger { display: block; }
          .admin-sidebar {
            display: none;
            position: fixed;
            top: 57px;
            left: 0;
            bottom: 0;
            z-index: 60;
          }
          .admin-sidebar.open { display: block; }
          .admin-overlay.open {
            display: block;
            position: fixed;
            inset: 0;
            top: 57px;
            background: rgba(0,0,0,0.3);
            z-index: 55;
          }
          .admin-main { padding: 16px; }
        }
      `}</style>
    </div>
  )
}
