import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { db } from '@/lib/supabase.js'
import LoadingSpinner from '@/components/LoadingSpinner.jsx'

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getDashboardMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><LoadingSpinner /></div>

  const cards = [
    { label: 'Artículos', value: metrics?.totalArticles || 0, to: '/admin/articulos', color: '#a7f3d0' },
    { label: 'Inscripciones', value: metrics?.totalEnrollments || 0, to: '/admin/cursos', color: '#fde68a' },
    { label: 'Suscriptores', value: metrics?.totalSubscribers || 0, to: '/admin/subscribers', color: '#c4b5fd' },
    { label: 'Leads Nuevos', value: metrics?.newLeads || 0, to: '/admin/leads', color: '#fca5a5' },
    { label: 'Eventos Activos', value: metrics?.upcomingEvents || 0, to: '/admin/eventos', color: '#93c5fd' },
  ]

  return (
    <>
      <Helmet><title>Dashboard | Mirella Admin</title></Helmet>
      <h1 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="card-brutalist" style={{ padding: '20px', textDecoration: 'none', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{c.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        <Link to="/admin/articulos/nuevo" className="btn-outline btn-small" style={{ justifyContent: 'center' }}>+ Nuevo Artículo</Link>
        <Link to="/admin/cursos/nuevo" className="btn-outline btn-small" style={{ justifyContent: 'center' }}>+ Nuevo Curso</Link>
        <Link to="/admin/eventos/nuevo" className="btn-outline btn-small" style={{ justifyContent: 'center' }}>+ Nuevo Evento</Link>
        <Link to="/admin/directorio/nuevo" className="btn-outline btn-small" style={{ justifyContent: 'center' }}>+ Nuevo Perfil</Link>
        <Link to="/admin/faqs" className="btn-outline btn-small" style={{ justifyContent: 'center' }}>+ Gestionar FAQs</Link>
      </div>
    </>
  )
}
