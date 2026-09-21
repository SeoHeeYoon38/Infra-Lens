import { useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'

const sourceRows = [
  { badge: 'BC', badgeClass: 'source-card', title: 'ABP_CONTEST_DATA', provider: 'BC카드 소비데이터', scope: '20대 · 시군구 · 2026.01—06', status: 'connected', detail: '편의점·외식·유통 업종별 금액과 결제건수를 집계해 소비 발자국을 만듭니다.' },
  { badge: '공공', badgeClass: 'source-public', title: '서울특별시 생활폐기물 발생량 및 처리현황', provider: '서울특별시 / 공공데이터포털', scope: '자치구별 · 연간 · XLSX', status: 'catalogued', detail: '발생량과 재활용·소각·매립 현황을 소비 신호와 교차 검증할 수 있습니다.', url: 'https://www.data.go.kr/data/15047172/fileData.do' },
  { badge: 'API', badgeClass: 'source-plan', title: '주민등록 1인가구 통계', provider: '행정안전부 / 공공데이터포털', scope: '행정동 · 월별 · API 예정', status: 'pending', detail: '소비로 추정한 생활권과 실제 1인 가구 분포의 일치도를 검증합니다.' },
  { badge: 'MAP', badgeClass: 'source-plan', title: '대학교·무인 회수기 좌표', provider: '지자체·공공데이터포털', scope: 'WGS84 좌표 · API 예정', status: 'pending', detail: '정책 후보지 주변의 시설 공백을 지도 레이어로 확인합니다.' },
]

export default function CatalogPage() {
  const [health, setHealth] = useState(null)
  useEffect(() => { fetch('/api/health').then((response) => response.json()).then(setHealth).catch(() => setHealth({ ok: false })) }, [])
  return <main className="page-main"><section className="page-hero catalog-hero"><div><span className="eyebrow">DATA CATALOG</span><h1>정책 신호의<br /><em>근거를 추적</em>하세요.</h1><p>연결된 데이터의 출처, 공간 단위, 갱신 상태를 한 화면에서 확인합니다.</p></div><div className="api-health"><span className={health?.ok ? 'health-dot online' : 'health-dot'} /><span>INFRA-LENS API</span><strong>{health?.ok ? 'ONLINE' : 'FALLBACK MODE'}</strong><small>{health?.generatedAt ? '집계 레이어 응답 정상' : '서버 연결 대기'}</small></div></section><section className="catalog-grid">{sourceRows.map((source) => <article className="panel source-card-large" key={source.title}><div className="source-card-head"><span className={`source-badge ${source.badgeClass}`}>{source.badge}</span><span className={`source-state ${source.status}`}>{source.status === 'connected' ? '연결됨' : source.status === 'catalogued' ? '카탈로그됨' : '연동 예정'}</span></div><h2>{source.title}</h2><p className="source-provider">{source.provider}</p><p className="source-detail">{source.detail}</p><div className="source-card-foot"><span>{source.scope}</span>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">원문 보기 <Icon name="external" size={13} /></a> : <span className="source-muted">공공데이터포털 연계 대기</span>}</div></article>)}</section><section className="panel catalog-method"><div><span className="eyebrow">MODEL NOTE</span><h2>현재 지표는 정책 판단을 위한<br />초기 스크리닝 모델입니다.</h2></div><div className="method-steps"><div><strong>01</strong><span>소비 데이터</span><p>20대·시군구·업종별 금액과 건수 집계</p></div><div><strong>02</strong><span>취약도 계산</span><p>편의점 ÷ (편의점 + 신선 유통)</p></div><div><strong>03</strong><span>공공 검증</span><p>폐기물·1인가구·시설 좌표 레이어 교차</p></div></div></section></main>
}
