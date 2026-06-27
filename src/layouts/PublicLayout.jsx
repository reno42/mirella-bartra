import { Outlet } from 'react-router-dom'
import Header from '@/components/Header.jsx'
import Footer from '@/components/Footer.jsx'
import CookieBanner from '@/components/CookieBanner.jsx'
import SocialSidebar from '@/components/SocialSidebar.jsx'
import { initConsent } from '@/utils/consentManager.js'
import { useEffect } from 'react'

export default function PublicLayout() {
  useEffect(() => {
    initConsent()
  }, [])

  return (
    <>
      <Header />
      <main className="container" style={{ minHeight: '70vh', paddingTop: '20px' }}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
      <CookieBanner />
      <SocialSidebar />
    </>
  )
}
