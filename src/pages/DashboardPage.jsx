import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import NationwideMapPanel from '../components/dashboard/NationwideMapPanel'
import useInfraData from '../hooks/useInfraData'
import { formatCount, formatWon } from '../utils/formatters'
import { getRisk, riskLabel, riskTone } from '../utils/risk'

export default function DashboardPage() {
  const data = useInfraData()
  const [params, setParams] = useSearchParams()
  const [mapLevel, setMapLevel] = useState(params.has('sido') ? 'district' : 'sido')
  const sido = params.get('sido') || '서울특별시'
  const regions = useMemo(() => data?.regions?.filter((region) => region.sido === sido) ?? [], [data, sido])
  const districts = data?.sidos?.find((item) => item.name === sido)?.districts ?? []
  const district = params.get('district') || (sido === '서울특별시' ? '관악구' : districts[0])
  const selectedRegion = regions.find((region) => region.district === district) ?? regions[0]
  const risk = getRisk(selectedRegion)

  const selectSido = useCallback((nextSido) => {
    const nextDistrict = nextSido === '서울특별시' ? '관악구' : data?.sidos?.find((item) => item.name === nextSido)?.districts?.[0] ?? ''
    setParams({ sido: nextSido, district: nextDistrict })
    setMapLevel('district')
  }, [data, setParams])
  const selectDistrict = useCallback((nextDistrict) => {
    setParams({ sido, district: nextDistrict })
    setMapLevel('district')
  }, [setParams, sido])
  const showNationwide = useCallback(() => setMapLevel('sido'), [])

  if (!data || !selectedRegion) return <main className="dashboard-main loading-shell"><div className="loading-orb" /><p>전국 지도 데이터를 불러오는 중입니다.</p></main>

  return <main className="dashboard-main dashboard-home"><section className="dashboard-intro"><div><span className="eyebrow">NATIONWIDE POLICY MAP</span><h1>시도에서 시군구로,<br /><em>필요한 지역만</em> 자세히 봅니다.</h1><p>전국을 한 화면에 겹치지 않고, 시도를 선택한 뒤 해당 시군구 지도로 확대합니다.</p></div><div className="intro-aside"><span>현재 분석 범위</span><strong>{data.filteredRows.toLocaleString()}개 시군구</strong><small>전국 17개 시도 · 20대 · 2026.01—06</small></div></section><section className="map-filter-bar"><div className="filter-heading"><span className="filter-symbol"><Icon name="map" size={16} /></span><div><strong>지역 선택</strong><small>시도 선택 후 시군구를 고릅니다.</small></div></div><SelectField label="시도" value={sido} options={data.sidos.map((item) => item.name)} onChange={selectSido} /><SelectField label="시군구" value={selectedRegion.district} options={districts} onChange={selectDistrict} /><Link className="detail-link" to={`/analysis?sido=${encodeURIComponent(sido)}&district=${encodeURIComponent(selectedRegion.district)}`}>상세 분석 열기 <Icon name="arrow" size={15} /></Link></section><section className="map-dashboard-grid"><NationwideMapPanel data={data} selectedSido={sido} selectedDistrict={selectedRegion.district} mapLevel={mapLevel} onSelectSido={selectSido} onSelectDistrict={selectDistrict} onShowNationwide={showNationwide} /><aside className="panel dashboard-selection"><div className="selection-header"><div><span className="eyebrow">ACTIVE REGION</span><h2>{selectedRegion.sido}</h2><strong>{selectedRegion.district}</strong></div><span className={`risk-pill ${riskTone(risk)}`}><i />{riskLabel(risk)}</span></div><div className="selection-score"><span>생활권 취약도</span><strong>{risk}<small>/100</small></strong><p>편의점 집중도 기준 · 소비데이터 기반 추정</p></div><div className="selection-metrics"><div><span>청년 소비</span><strong>{formatWon(selectedRegion.totalAmt)}</strong></div><div><span>결제 건수</span><strong>{formatCount(selectedRegion.totalCnt)}건</strong></div><div><span>평균 객단가</span><strong>{selectedRegion.avgTicket.toLocaleString()}원</strong></div></div><div className="selection-note"><Icon name="signal" size={16} /><p><b>{selectedRegion.district}</b>의 소비 신호를 상세 분석으로 넘겨 공공 폐기물·시설 레이어와 교차 검증하세요.</p></div><Link className="primary-action" to={`/analysis?sido=${encodeURIComponent(sido)}&district=${encodeURIComponent(selectedRegion.district)}`}>지역 상세 분석 <Icon name="arrow" size={16} /></Link></aside></section></main>
}
