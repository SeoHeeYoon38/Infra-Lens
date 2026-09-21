import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'

export default function AppHeader() {
  return <header className="app-header"><div className="brand-lockup"><div className="brand-mark"><span /><span /><span /></div><div><strong>Infra-Lens</strong><small>hyperlocal infrastructure intelligence</small></div></div><nav className="main-nav" aria-label="주요 메뉴"><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="compass" size={16} /> 전국 지도</NavLink><NavLink to="/analysis" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="signal" size={16} /> 상세 분석</NavLink><NavLink to="/compare" className={({ isActive }) => isActive ? 'active' : ''}><Icon name="map" size={16} /> 지역 비교</NavLink></nav></header>
}
