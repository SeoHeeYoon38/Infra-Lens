import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppFooter from './AppFooter'
import AppHeader from './AppHeader'
import OnboardingGuide from './OnboardingGuide'

export default function AppShell() {
  const location = useLocation()
  const [guideOpen, setGuideOpen] = useState(true)
  useEffect(() => {
    const titles = { '/dashboard': 'Infra-Lens · 청년 주거 인프라 진단', '/compare': 'Infra-Lens · 지역 비교', '/catalog': 'Infra-Lens · 데이터 카탈로그' }
    document.title = titles[location.pathname] ?? 'Infra-Lens · 정책 인텔리전스'
  }, [location.pathname])
  return <div className="app-shell"><AppHeader onOpenGuide={() => setGuideOpen(true)} />{guideOpen && <OnboardingGuide onClose={() => setGuideOpen(false)} />}<Outlet /><AppFooter /></div>
}
