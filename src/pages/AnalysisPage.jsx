import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import MetricCard from '../components/dashboard/MetricCard'
import InsightPanel from '../components/dashboard/InsightPanel'
import CategoryBars from '../components/dashboard/CategoryBars'
import TrendPanel from '../components/dashboard/TrendPanel'
import useInfraData from '../hooks/useInfraData'
import { formatCount, formatWon } from '../utils/formatters'
import { getRisk } from '../utils/risk'

export default function AnalysisPage() {
  const data = useInfraData()
  const [params, setParams] = useSearchParams()
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [printPending, setPrintPending] = useState(false)
  const sido = params.get('sido') || '서울특별시'
  const regions = useMemo(() => data?.regions?.filter((region) => region.sido === sido) ?? [], [data, sido])
  const district = params.get('district') || regions[0]?.district
  const selectedRegion = regions.find((region) => region.district === district) ?? regions[0]
  const districts = data?.sidos?.find((item) => item.name === sido)?.districts ?? []
  const risk = getRisk(selectedRegion)
  const priority = risk >= 65 ? '1순위' : risk >= 50 ? '2순위' : '관찰'

  useEffect(() => {
    if (!report || !printPending) return undefined
    const timer = window.setTimeout(() => {
      window.print()
      setPrintPending(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [report, printPending])

  const selectSido = (nextSido) => {
    const nextDistrict = data?.sidos?.find((item) => item.name === nextSido)?.districts?.[0] ?? ''
    setParams({ sido: nextSido, district: nextDistrict })
    setReport(null)
  }

  const selectDistrict = (nextDistrict) => {
    setParams({ sido, district: nextDistrict })
    setReport(null)
  }

  const handleReport = async () => {
    if (!selectedRegion || reportLoading) return
    setReportLoading(true)
    setPrintPending(true)
    try {
      const response = await fetch(`/api/report?sido=${encodeURIComponent(sido)}&district=${encodeURIComponent(selectedRegion.district)}`)
      if (!response.ok) throw new Error('report api unavailable')
      setReport((await response.json()).report)
    } catch {
      setReport({
        decision: `${sido} ${selectedRegion.district} 지역을 ${risk >= 65 ? '1순위' : risk >= 50 ? '2순위' : '관찰'} 정책 검토 대상으로 제안합니다.`,
        summary: `편의점 집중도 ${risk}%를 기준으로 현장 검증이 필요한 지역입니다.`,
        evidence: ['BC카드 20대 소비데이터 연결 확인', '공공데이터 레이어와 교차 검증 필요'],
        actions: ['반경 500m 내 회수·분리배출 거점 현장 확인', '생활폐기물 통계와 설치 후보지를 함께 검토'],
      })
    } finally {
      setReportLoading(false)
    }
  }

  if (!data || !selectedRegion) return <main className="page-main loading-shell"><div className="loading-orb" /><p>상세 분석 데이터를 불러오는 중입니다.</p></main>

  return <main className="page-main analysis-main">
    <section className="analysis-heading"><div><span className="eyebrow">REGION ANALYSIS</span><h1>{sido} <em>{selectedRegion.district}</em></h1><p>선택한 지역에 대해 정책 결론과 근거를 바로 확인합니다.</p></div><div className="analysis-selects"><SelectField label="시도" value={sido} options={data.sidos.map((item) => item.name)} onChange={selectSido} /><SelectField label="시군구" value={selectedRegion.district} options={districts} onChange={selectDistrict} /></div></section>
    <section className="decision-hero panel"><div className="decision-lead"><span className="eyebrow">SO WHAT?</span><h2>{sido} {selectedRegion.district}은<br /><em>{priority} 정책 검토 지역</em>입니다.</h2></div><div className="decision-flow"><div><span>01 · 발견</span><strong>{risk}%</strong><small>편의점 집중도</small></div><div><span>02 · 검증</span><strong>{selectedRegion.singleHouseholds ? selectedRegion.singleHouseholds.toLocaleString() : '—'}</strong><small>시군구 1인가구</small></div><div><span>03 · 결정</span><strong>500m</strong><small>회수 거점 검토 반경</small></div></div></section>
    <section className="metrics-grid"><MetricCard label="청년 소비 규모" value={formatWon(selectedRegion.totalAmt)} caption="최근 6개월 · 전체 업종" accent="#67d6c0" icon="signal" sparkline={selectedRegion.monthly.map((item) => item.amt)} /><MetricCard label="편의점 집중도" value={`${risk}%`} caption="편의점 ÷ 신선 유통" accent="#ff7262" icon="layers" sparkline={[48, 52, 55, 57, 61, risk]} /><MetricCard label="결제 건수" value={`${formatCount(selectedRegion.totalCnt)}건`} caption={`객단가 ${selectedRegion.avgTicket.toLocaleString()}원`} accent="#8d7dff" icon="database" sparkline={selectedRegion.monthly.map((item) => item.cnt)} /><MetricCard label="1인가구" value={selectedRegion.singleHouseholds ? `${selectedRegion.singleHouseholds.toLocaleString()}가구` : '자료 없음'} caption={selectedRegion.householdYear ? `KOSIS ${selectedRegion.householdYear}년 · 시군구` : '전국 원천 매칭 대기'} accent="#f8b55d" icon="map" /></section>
    <section className="analysis-grid"><InsightPanel region={selectedRegion} onGenerateReport={handleReport} report={report} reportLoading={reportLoading} /><div className="analysis-charts"><CategoryBars region={selectedRegion} /><TrendPanel region={selectedRegion} /></div></section>
    <section className="action-panel panel"><div className="action-icon"><Icon name="recycle" size={22} /></div><div className="action-copy"><span className="eyebrow">NEXT POLICY MOVE</span><h2>{selectedRegion.district}를 스마트 회수 거점 후보로 검토하세요.</h2><p>리포트를 생성하면 취약도, 소비 근거, 1인가구 규모를 묶어 실행 순서까지 제안합니다.</p></div><div className="action-stats"><div><span>추천 반경</span><strong>500m</strong></div><div><span>검증 레이어</span><strong>3개</strong></div><button type="button" onClick={handleReport} disabled={reportLoading}>{reportLoading ? '생성 중…' : '리포트 생성'} <Icon name="arrow" size={15} /></button></div></section>
  </main>
}
