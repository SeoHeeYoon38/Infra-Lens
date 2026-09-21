import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'

export default function AppHeader() {
  return <header className="app-header"><div className="brand-lockup"><div className="brand-mark"><span /><span /><span /></div><div><strong>Infra-Lens</strong><small>hyperlocal infrastructure intelligence</small></div></div><nav className="main-nav" aria-label="주요 메뉴"><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="compass" size={16} /> 진단 대시보드</NavLink><NavLink to="/compare" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="map" size={16} /> 지역 비교</NavLink><NavLink to="/catalog" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="database" size={16} /> 데이터 카탈로그</NavLink></nav><div className="header-status"><span className="live-dot" /><span>LIVE MODEL</span><span className="header-divider" /><span>2026.06 기준</span></div></header>
}
