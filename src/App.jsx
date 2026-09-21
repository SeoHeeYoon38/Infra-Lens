import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ComparePage from './pages/ComparePage'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/analysis" element={<AnalysisPage />} /><Route path="/compare" element={<ComparePage />} /><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Route></Routes></BrowserRouter>
}
