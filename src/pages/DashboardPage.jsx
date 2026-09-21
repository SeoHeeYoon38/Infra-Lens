import { useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import MetricCard from '../components/dashboard/MetricCard'
import MapPanel from '../components/dashboard/MapPanel'
import InsightPanel from '../components/dashboard/InsightPanel'
import CategoryBars from '../components/dashboard/CategoryBars'
import TrendPanel from '../components/dashboard/TrendPanel'
import DataSources from '../components/dashboard/DataSources'
import useInfraData from '../hooks/useInfraData'
import { formatCount, formatWon } from '../utils/formatters'
import { getRisk } from '../utils/risk'

export default function DashboardPage() {
  const data = useInfraData()
  const [sido, setSido] = useState('서울특별시')
  const [district, setDistrict] = useState('관악구')
  const [showWaste, setShowWaste] = useState(true)
  const [showUniversity, setShowUniversity] = useState(true)
  const [showRecycling, setShowRecycling] = useState(true)
  const [report, setReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const regions = useMemo(() => data?.regions?.filter((region) => region.sido === sido) ?? [], [data, sido])
  const selectedRegion = regions.find((region) => region.district === district) ?? regions[0]
  const districts = data?.sidos?.find((item) => item.name === sido)?.districts ?? []
  const districtRisk = getRisk(selectedRegion)

  const handleSidoChange = (event) => {
    const nextSido = event.target.value
    setSido(nextSido)
    const nextDistricts = data?.sidos?.find((item) => item.name === nextSido)?.districts ?? []
    setDistrict(nextDistricts[0] ?? '')
    setReport('')
  }

  const handleDistrictChange = (event) => {
    setDistrict(event.target.value)
    setReport('')
  }

  const handleReport = async () => {
    if (!selectedRegion) return
    setReportLoading(true)
    try {
      const response = await fetch(`/api/report?sido=${encodeURIComponent(sido)}&district=${encodeURIComponent(selectedRegion.district)}`)
      if (!response.ok) throw new Error('report api unavailable')
      const payload = await response.json()
      setReport(payload.report)
    } catch {
      const risk = getRisk(selectedRegion)
      setReport(`${selectedRegion.district}은 편의점 집중도 ${risk}%로 분류됩니다. 반경 500m 내 무인 회수기·분리배출 거점 후보를 우선 검토하고, 서울시 생활폐기물 통계와 다음 연계 시점에 교차 검증하세요.`)
    } finally {
      setReportLoading(false)
    }
  }

  if (!data || !selectedRegion) return <main className="dashboard-main loading-shell"><div className="loading-orb" /><p>Infra-Lens 데이터 레이어를 불러오는 중입니다.</p></main>

  return <main className="dashboard-main"><section className="dashboard-intro"><div><span className="eyebrow">EVIDENCE-BASED POLICY CONSOLE</span><h1>청년 주거 인프라<br /><em>취약 신호</em>를 포착하세요.</h1><p>20대 소비 발자국과 공공 데이터를 겹쳐, 동네의 다음 인프라 결정을 만듭니다.</p></div><div className="intro-aside"><span>현재 분석 범위</span><strong>{data.filteredRows.toLocaleString()}개 시군구</strong><small>BC카드 소비행태 · 20대 · 2026.01—06</small></div></section><section className="filter-bar" aria-label="분석 조건"><div className="filter-heading"><span className="filter-symbol"><Icon name="signal" size={15} /></span><div><strong>분석 렌즈</strong><small>지역·타깃·시간을 고정해 비교합니다.</small></div></div><label className="filter-control"><span>시도</span><select value={sido} onChange={handleSidoChange}>{data.sidos.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}</select><Icon name="chevron" size={14} /></label><label className="filter-control"><span>시군구</span><select value={selectedRegion.district} onChange={handleDistrictChange}>{districts.map((item) => <option value={item} key={item}>{item}</option>)}</select><Icon name="chevron" size={14} /></label><div className="filter-chip"><span>AGE_CD</span><strong>20대</strong><i>고정</i></div><div className="filter-chip"><span>GENDER</span><strong>전체</strong><i>남·여</i></div><button type="button" className="refresh-button" title="데이터 기준 새로고침"><Icon name="refresh" size={16} /></button></section><section className="metrics-grid"><MetricCard label="청년 소비 규모" value={formatWon(selectedRegion.totalAmt)} caption="최근 6개월 · 전체 업종" accent="#67d6c0" icon="signal" sparkline={selectedRegion.monthly.map((item) => item.amt)} /><MetricCard label="편의점 집중도" value={`${districtRisk}%`} caption="편의점 ÷ 신선 유통" accent="#ff7262" icon="layers" sparkline={[48, 52, 55, 57, 61, districtRisk]} /><MetricCard label="결제 건수" value={`${formatCount(selectedRegion.totalCnt)}건`} caption={`객단가 ${selectedRegion.avgTicket.toLocaleString()}원`} accent="#8d7dff" icon="database" sparkline={selectedRegion.monthly.map((item) => item.cnt)} /><MetricCard label="공공 레이어" value="2 / 5" caption="폐기물 · 대학 연결" accent="#f8b55d" icon="map" /></section><section className="primary-grid"><MapPanel regions={regions} selectedDistrict={selectedRegion.district} onSelectDistrict={setDistrict} showWaste={showWaste} setShowWaste={setShowWaste} showUniversity={showUniversity} setShowUniversity={setShowUniversity} showRecycling={showRecycling} setShowRecycling={setShowRecycling} /><InsightPanel region={selectedRegion} onGenerateReport={handleReport} report={report} reportLoading={reportLoading} /></section><section className="secondary-grid"><CategoryBars region={selectedRegion} /><TrendPanel region={selectedRegion} /></section><section className="action-panel panel"><div className="action-icon"><Icon name="recycle" size={22} /></div><div className="action-copy"><span className="eyebrow">NEXT POLICY MOVE</span><h2>{selectedRegion.district}를 스마트 회수 거점 후보로 검토하세요.</h2><p>편의점 집중도가 높은 생활권과 공공 폐기물 데이터를 교차 검증하면, 무인 회수기 설치 우선순위를 좁힐 수 있습니다.</p></div><div className="action-stats"><div><span>추천 반경</span><strong>500m</strong></div><div><span>검증 레이어</span><strong>3개</strong></div><button type="button" onClick={handleReport}>리포트에 담기 <Icon name="arrow" size={15} /></button></div></section><DataSources /></main>
}
