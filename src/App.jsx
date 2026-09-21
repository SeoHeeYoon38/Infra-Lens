import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CatalogPage from './pages/CatalogPage'
import ComparePage from './pages/ComparePage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/compare" element={<ComparePage />} /><Route path="/catalog" element={<CatalogPage />} /><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Route></Routes></BrowserRouter>
}
