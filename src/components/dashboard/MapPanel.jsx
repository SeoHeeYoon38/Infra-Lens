import Icon from '../ui/Icon'
import Toggle from './Toggle'
import { getRisk, riskLabel } from '../../utils/risk'

export default function MapPanel({ regions, selectedDistrict, onSelectDistrict, showWaste, setShowWaste, showUniversity, setShowUniversity, showRecycling, setShowRecycling }) {
  const selected = regions.find((region) => region.district === selectedDistrict)
  const mapRegions = [...regions].sort((a, b) => a.district.localeCompare(b.district, 'ko')).slice(0, 25)
  const selectedRisk = getRisk(selected)
  const markers = [
    { name: '서울대', type: '대학', x: 55, y: 50, visible: showUniversity },
    { name: '청년센터', type: '공공', x: 42, y: 69, visible: showWaste },
    { name: '회수기 후보', type: '회수', x: 68, y: 29, visible: showRecycling },
  ]

  return <section className="panel map-panel"><div className="map-panel-head"><div><span className="eyebrow">SPATIAL LENS</span><h2>시군구 소비 취약도</h2></div><span className="prototype-badge"><span className="live-dot" /> 프로토타입 · CCG 단위</span></div><div className="map-toolbar"><div className="map-toolbar-title"><Icon name="layers" size={15} /> 지도 레이어</div><div className="layer-list"><Toggle label="폐기물" checked={showWaste} onChange={setShowWaste} color="#ffbf67" /><Toggle label="대학" checked={showUniversity} onChange={setShowUniversity} color="#62d6c0" /><Toggle label="회수기" checked={showRecycling} onChange={setShowRecycling} color="#a88cff" /></div></div><div className="map-canvas" aria-label="시군구별 소비 취약도 시각화"><div className="map-watermark">SEOUL<br /><span>URBAN SIGNAL MAP</span></div><div className="map-grid-lines" /><div className="map-axis-label map-axis-top">편의점 집중도 ↑</div><div className="map-axis-label map-axis-bottom">신선식품 접근성 ↓</div><div className="district-grid">{mapRegions.map((region, index) => { const risk = getRisk(region); const isSelected = region.district === selectedDistrict; return <button type="button" className={`district-cell ${isSelected ? 'selected' : ''}`} key={`${region.sido}-${region.district}`} onClick={() => onSelectDistrict(region.district)} style={{ '--risk': `${Math.max(risk, 18)}%`, '--delay': `${index * 18}ms` }} title={`${region.district} · 편의점 집중도 ${risk}%`}><span>{region.district.replace('구', '')}</span><small>{risk}</small></button> })}</div>{markers.filter((marker) => marker.visible).map((marker) => <div key={marker.name} className={`map-marker marker-${marker.type}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}><span className="marker-pulse" /><span>{marker.name}</span></div>)}<div className="map-callout" style={{ left: '59%', top: '61%' }}><span>{selectedDistrict}</span><strong>{selectedRisk}%</strong><small>취약 추정</small></div><div className="map-legend"><span>낮음</span><i className="legend-low" /><i className="legend-mid" /><i className="legend-high" /><span>높음</span></div></div><div className="map-footer"><span><i className="legend-dot critical" /> {selectedDistrict} {riskLabel(selectedRisk)} 신호</span><span>색상값 = 편의점 ÷ (편의점 + 대형 유통) 소비금액</span></div></section>
}
