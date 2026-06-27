import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useEffect, useState } from 'react'

import PublicLayout from '@/layouts/PublicLayout.jsx'
import AdminLayout from '@/layouts/AdminLayout.jsx'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import PageLoader from '@/components/PageLoader.jsx'

// Public Pages
import Home from '@/pages/public/Home.jsx'
import Articulos from '@/pages/public/Articulos.jsx'
import ArticuloDetalle from '@/pages/public/ArticuloDetalle.jsx'
import Cursos from '@/pages/public/Cursos.jsx'
import CursoDetalle from '@/pages/public/CursoDetalle.jsx'
import Eventos from '@/pages/public/Eventos.jsx'
import EventoDetalle from '@/pages/public/EventoDetalle.jsx'
import Directorio from '@/pages/public/Directorio.jsx'
import TerapeutaDetalle from '@/pages/public/TerapeutaDetalle.jsx'
import DirectorioForm from '@/pages/public/DirectorioForm.jsx'
import Contacto from '@/pages/public/Contacto.jsx'
import LibroReclamaciones from '@/pages/public/LibroReclamaciones.jsx'
import DerechosARCO from '@/pages/public/DerechosARCO.jsx'
import Legal from '@/pages/public/Legal.jsx'
import TrabajaConNosotros from '@/pages/public/TrabajaConNosotros.jsx'
import Descuentos from '@/pages/public/Descuentos.jsx'
import DescuentoDetalle from '@/pages/public/DescuentoDetalle.jsx'
import Login from '@/pages/public/Login.jsx'
import ResetPassword from '@/pages/public/ResetPassword.jsx'
import NotFound from '@/pages/public/NotFound.jsx'
import Buscar from '@/pages/public/Buscar.jsx'
import CapacitacionesB2B from '@/pages/public/CapacitacionesB2B.jsx'
import Descargables from '@/pages/public/Descargables.jsx'
import Depositar from '@/pages/public/Depositar.jsx'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard.jsx'
import AdminArticulos from '@/pages/admin/Articulos.jsx'
import AdminArticuloEditor from '@/pages/admin/ArticuloEditor.jsx'
import AdminCursos from '@/pages/admin/Cursos.jsx'
import AdminCursoEditor from '@/pages/admin/CursoEditor.jsx'
import AdminEventos from '@/pages/admin/Eventos.jsx'
import AdminEventoEditor from '@/pages/admin/EventoEditor.jsx'
import AdminDirectorio from '@/pages/admin/Directorio.jsx'
import AdminDirectorioEditor from '@/pages/admin/DirectorioEditor.jsx'
import AdminLeads from '@/pages/admin/Leads.jsx'
import AdminSubscribers from '@/pages/admin/Subscribers.jsx'
import AdminFAQs from '@/pages/admin/FAQs.jsx'
import AdminTestimonials from '@/pages/admin/Testimonials.jsx'
import AdminComplaints from '@/pages/admin/Complaints.jsx'
import AdminMedia from '@/pages/admin/Media.jsx'
import AdminConfig from '@/pages/admin/Config.jsx'
import AdminUsers from '@/pages/admin/Users.jsx'
import AdminDeposits from '@/pages/admin/Deposits.jsx'
import AdminBidding from '@/pages/admin/Bidding.jsx'
import AdminB2B from '@/pages/admin/B2B.jsx'

// Init loading interceptor
import '@/lib/loadingInterceptor.js'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <HelmetProvider>
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'} language="es">
        <BrowserRouter>
          <ScrollToTop />
          <PageLoader />
          <Routes>
            {/* ── Public Routes ── */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="/articulos" element={<Articulos />} />
              <Route path="/articulos/:slug" element={<ArticuloDetalle />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/cursos/:slug" element={<CursoDetalle />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/eventos/:slug" element={<EventoDetalle />} />
              <Route path="/directorio" element={<Directorio />} />
              <Route path="/directorio/:slug" element={<TerapeutaDetalle />} />
              <Route path="/directorio/inscribirse" element={<DirectorioForm />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/libro-reclamaciones" element={<LibroReclamaciones />} />
              <Route path="/derechos-arco" element={<DerechosARCO />} />
              <Route path="/legal/:slug" element={<Legal />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/trabaja-con-nosotros" element={<TrabajaConNosotros />} />
              <Route path="/descuentos" element={<Descuentos />} />
              <Route path="/descuentos/:slug" element={<DescuentoDetalle />} />
              <Route path="/capacitaciones-b2b" element={<CapacitacionesB2B />} />
              <Route path="/descargables" element={<Descargables />} />
              <Route path="/depositar" element={<Depositar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ── Admin Routes (Protected) ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="articulos" element={<AdminArticulos />} />
              <Route path="articulos/nuevo" element={<AdminArticuloEditor />} />
              <Route path="articulos/editar/:id" element={<AdminArticuloEditor />} />
              <Route path="cursos" element={<AdminCursos />} />
              <Route path="cursos/nuevo" element={<AdminCursoEditor />} />
              <Route path="cursos/editar/:id" element={<AdminCursoEditor />} />
              <Route path="eventos" element={<AdminEventos />} />
              <Route path="eventos/nuevo" element={<AdminEventoEditor />} />
              <Route path="eventos/editar/:id" element={<AdminEventoEditor />} />
              <Route path="directorio" element={<AdminDirectorio />} />
              <Route path="directorio/nuevo" element={<AdminDirectorioEditor />} />
              <Route path="directorio/editar/:id" element={<AdminDirectorioEditor />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="faqs" element={<AdminFAQs />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="config" element={<AdminConfig />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="deposits" element={<AdminDeposits />} />
              <Route path="bidding" element={<AdminBidding />} />
              <Route path="b2b" element={<AdminB2B />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GoogleReCaptchaProvider>
    </HelmetProvider>
  )
}
