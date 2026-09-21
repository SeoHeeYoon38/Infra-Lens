import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ComparePage from './pages/ComparePage'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'

const appPaths = new Set(['/dashboard', '/analysis', '/compare', '/catalog'])

function LegacyPathBridge() {
  const { pathname, search } = window.location
  if (!window.location.hash && appPaths.has(pathname)) {
    window.location.replace(`${window.location.origin}/#${pathname}${search}`)
    return null
  }

  return <HashRouter><Routes><Route element={<AppShell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/analysis" element={<AnalysisPage />} /><Route path="/compare" element={<ComparePage />} /><Route path="/catalog" element={<Navigate to="/dashboard" replace />} /><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Route></Routes></HashRouter>
}

export default function App() {
  return <LegacyPathBridge />
}
