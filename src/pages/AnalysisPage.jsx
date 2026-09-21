import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import MetricCard from '../components/dashboard/MetricCard'
import InsightPanel from '../components/dashboard/InsightPanel'
import CategoryBars from '../components/dashboard/CategoryBars'
import TrendPanel from '../components/dashboard/TrendPanel'
import DataSources from '../components/dashboard/DataSources'
import useInfraData from '../hooks/useInfraData'
import { formatCount, formatWon } from '../utils/formatters'
import { getRisk } from '../utils/risk'

export default function AnalysisPage() {
  const data = useInfraData()
  const [params, setParams] = useSearchParams()
  const [report, setReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const sido = params.get('sido') || '서울특별시'
  const regions = useMemo(() => data?.regions?.filter((region) => region.sido === sido) ?? [], [data, sido])
  const district = params.get('district') || regions[0]?.district
  const selectedRegion = regions.find((region) => region.district === district) ?? regions[0]
  const districts = data?.sidos?.find((item) => item.name === sido)?.districts ?? []
  const risk = getRisk(selectedRegion)

  const selectSido = (nextSido) => {
    const nextDistrict = data?.sidos?.find((item) => item.name === nextSido)?.districts?.[0] ?? ''
    setParams({ sido: nextSido, district: nextDistrict })
    setReport('')
  }
  const selectDistrict = (nextDistrict) => { setParams({ sido, district: nextDistrict }); setReport('') }
  const handleReport = async () => {
    if (!selectedRegion) return
    setReportLoading(true)
    try { const response = await fetch(`/api/report?sido=${encodeURIComponent(sido)}&district=${encodeURIComponent(selectedRegion.district)}`); if (!response.ok) throw new Error('report api unavailable'); setReport((await response.json()).report) } catch { setReport(`${selectedRegion.district}은 편의점 집중도 ${risk}%로 분류됩니다. 반경 500m 내 무인 회수기·분리배출 거점 후보를 우선 검토하세요.`) } finally { setReportLoading(false) }
  }

  if (!data || !selectedRegion) return <main className="page-main loading-shell"><div className="loading-orb" /><p>상세 분석 데이터를 불러오는 중입니다.</p></main>
  return <main className="page-main analysis-main"><section className="analysis-heading"><div><span className="eyebrow">REGION ANALYSIS</span><h1>{sido} <em>{selectedRegion.district}</em></h1><p>선택한 생활권의 소비·공공 신호를 상세하게 확인합니다.</p></div><div className="analysis-selects"><SelectField label="시도" value={sido} options={data.sidos.map((item) => item.name)} onChange={selectSido} /><SelectField label="시군구" value={selectedRegion.district} options={districts} onChange={selectDistrict} /></div></section><section className="metrics-grid"><MetricCard label="청년 소비 규모" value={formatWon(selectedRegion.totalAmt)} caption="최근 6개월 · 전체 업종" accent="#67d6c0" icon="signal" sparkline={selectedRegion.monthly.map((item) => item.amt)} /><MetricCard label="편의점 집중도" value={`${risk}%`} caption="편의점 ÷ 신선 유통" accent="#ff7262" icon="layers" sparkline={[48, 52, 55, 57, 61, risk]} /><MetricCard label="결제 건수" value={`${formatCount(selectedRegion.totalCnt)}건`} caption={`객단가 ${selectedRegion.avgTicket.toLocaleString()}원`} accent="#8d7dff" icon="database" sparkline={selectedRegion.monthly.map((item) => item.cnt)} /><MetricCard label="분석 기준" value="20대" caption="BC카드 소비데이터" accent="#f8b55d" icon="map" /></section><section className="analysis-grid"><InsightPanel region={selectedRegion} onGenerateReport={handleReport} report={report} reportLoading={reportLoading} /><div className="analysis-charts"><CategoryBars region={selectedRegion} /><TrendPanel region={selectedRegion} /></div></section><section className="action-panel panel"><div className="action-icon"><Icon name="recycle" size={22} /></div><div className="action-copy"><span className="eyebrow">NEXT POLICY MOVE</span><h2>{selectedRegion.district}를 스마트 회수 거점 후보로 검토하세요.</h2><p>소비 신호를 공공 폐기물 통계와 교차 검증하면 설치 우선순위를 좁힐 수 있습니다.</p></div><div className="action-stats"><div><span>추천 반경</span><strong>500m</strong></div><div><span>검증 레이어</span><strong>3개</strong></div><button type="button" onClick={handleReport}>리포트 생성 <Icon name="arrow" size={15} /></button></div></section><DataSources /></main>
}
