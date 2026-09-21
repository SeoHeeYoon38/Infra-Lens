import { useMemo, useState } from 'react'
import useInfraData from '../hooks/useInfraData'
import { formatWon } from '../utils/formatters'
import { getRisk, riskLabel, riskTone } from '../utils/risk'

export default function ComparePage() {
  const data = useInfraData()
  const [sido, setSido] = useState('서울특별시')
  const regions = useMemo(() => data?.regions?.filter((region) => region.sido === sido).sort((a, b) => getRisk(b) - getRisk(a)) ?? [], [data, sido])
  const selected = regions[0]

  if (!data || !selected) return <main className="page-main loading-shell"><div className="loading-orb" /><p>지역 비교 데이터를 불러오는 중입니다.</p></main>

  return <main className="page-main"><section className="page-hero"><div><span className="eyebrow">REGION COMPARISON</span><h1>어느 지역이<br /><em>먼저 움직여야</em> 할까요?</h1><p>같은 기준으로 시군구를 정렬해, 예산과 현장 검증의 우선순위를 좁힙니다.</p></div><label className="hero-select"><span>비교 시도</span><select value={sido} onChange={(event) => setSido(event.target.value)}>{data.sidos.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}</select></label></section><section className="comparison-summary"><div><span>분석 지역</span><strong>{regions.length}개</strong><small>{sido} 시군구 전체</small></div><div><span>최고 취약 신호</span><strong>{selected.district} · {getRisk(selected)}%</strong><small>편의점 집중도 기준</small></div><div><span>상위 5개 지역 평균</span><strong>{Math.round(regions.slice(0, 5).reduce((sum, region) => sum + getRisk(region), 0) / Math.min(regions.length, 5))}%</strong><small>최근 6개월 집계</small></div></section><section className="comparison-layout"><div className="panel comparison-table-panel"><div className="table-heading"><div><span className="eyebrow">RANKING TABLE</span><h2>취약 신호 랭킹</h2></div><span>편의점 ÷ 신선 유통</span></div><div className="comparison-table"><div className="table-row table-head"><span>순위</span><span>시군구</span><span>취약도</span><span>소비 규모</span><span>판정</span></div>{regions.slice(0, 15).map((region, index) => { const risk = getRisk(region); return <div className={`table-row ${index === 0 ? 'top-row' : ''}`} key={`${region.sido}-${region.district}`}><span className="rank">{String(index + 1).padStart(2, '0')}</span><strong>{region.district}</strong><span><i className="table-bar"><b style={{ width: `${risk}%` }} /></i><em>{risk}</em></span><span className="table-amount">{formatWon(region.totalAmt)}</span><span className={`risk-pill ${riskTone(risk)}`}><i />{riskLabel(risk)}</span></div> })}</div></div><aside className="panel compare-note"><span className="eyebrow">HOW TO READ</span><h2>붉은 신호는<br />결핍의 방향을 말합니다.</h2><p>편의점 소비 자체를 문제로 보지 않습니다. 신선식품을 대체하는 소비가 누적되고, 공공 폐기물 데이터와 겹칠 때 인프라 개입의 후보로 해석합니다.</p><div className="note-rule" /><div><span>다음 단계</span><strong>지역 클릭 → 대시보드에서 레이어 교차 검증</strong></div></aside></section></main>
}
