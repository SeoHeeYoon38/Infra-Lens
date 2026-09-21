import Icon from '../ui/Icon'
import PolicyGeoMap from './PolicyGeoMap'
import { getRisk, riskLabel, riskTone } from '../../utils/risk'

function shortSido(name) {
  return name.replace('특별자치도', '').replace('특별자치시', '').replace('특별시', '').replace('광역시', '')
}

export default function NationwideMapPanel({ data, selectedSido, selectedDistrict, mapLevel, onSelectSido, onSelectDistrict, onShowNationwide }) {
  const stats = data.sidos.map((item) => {
    const regions = data.regions.filter((region) => region.sido === item.name)
    const risk = Math.round(regions.reduce((sum, region) => sum + getRisk(region), 0) / Math.max(regions.length, 1))
    return { ...item, risk, regions }
  })
  const selected = stats.find((item) => item.name === selectedSido) ?? stats[0]
  const isDistrictView = mapLevel === 'district'

  return <section className="panel nationwide-map-panel">
    <div className="map-panel-head"><div><span className="eyebrow">{isDistrictView ? 'DISTRICT POLICY MAP' : 'NATIONWIDE POLICY MAP'}</span><h2>{isDistrictView ? `${selected.name} 시군구 지도` : '전국 청년 주거 인프라 지도'}</h2><p className="map-subtitle">{isDistrictView ? '필요한 시군구만 크게 펼쳐서 생활권 취약도를 확인합니다.' : '외부 지도 없이 Infra-Lens 행정경계와 취약도만 보여줍니다.'}</p></div><span className="prototype-badge"><span className="live-dot" /> INFRA-LENS</span></div>
    <div className="map-toolbar"><div className="map-toolbar-title"><Icon name="map" size={15} /> {isDistrictView ? `${selected.regions.length}개 시군구` : '전국 17개 시도'}</div>{isDistrictView ? <button type="button" className="map-back-button" onClick={onShowNationwide}><Icon name="arrow" size={14} /> 전국 보기</button> : <span className="map-toolbar-hint">지역 클릭 → 해당 범위 확대</span>}</div>
    <div className="map-visual-row"><PolicyGeoMap data={data} mapLevel={mapLevel} selectedSido={selectedSido} selectedDistrict={selectedDistrict} onSelectSido={onSelectSido} onSelectDistrict={onSelectDistrict} /><div className="map-legend-readable"><span className="legend-title">취약도</span><div className="legend-item"><i className="legend-stable" /><b>안정</b></div><div className="legend-item"><i className="legend-watch" /><b>관찰</b></div><div className="legend-item"><i className="legend-critical" /><b>취약</b></div><span className="legend-caption">편의점 중심 소비 비율<br />BC카드 20대</span></div></div>
    <div className="map-selection-row"><div className="selection-copy"><span className="eyebrow">{isDistrictView ? 'SELECTED REGION' : 'MAP GUIDE'}</span><strong>{isDistrictView ? `${shortSido(selected.name)} · ${selectedDistrict}` : '전국에서 시군구까지 두 단계'}</strong><span>{isDistrictView ? '지도를 클릭하면 우측 정책 신호가 즉시 갱신됩니다.' : '지도 위 글자를 줄이고 색상과 경계로 먼저 읽도록 구성했습니다.'}</span></div><div className="selection-status"><i className={`legend-dot ${riskTone(selected.risk)}`} />{selected.name} 평균 {selected.risk}% · {riskLabel(selected.risk)}</div></div>
  </section>
}
