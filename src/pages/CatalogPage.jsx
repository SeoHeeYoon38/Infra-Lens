import { useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'

const sourceDetails = {
  ABP_CONTEST_DATA: { badge: 'BC', badgeClass: 'source-card', detail: '편의점·외식·유통 업종별 금액과 결제건수를 집계해 소비 발자국을 만듭니다.' },
  '서울특별시 생활폐기물 발생량 및 처리현황': { badge: '공공', badgeClass: 'source-public', detail: '발생량과 재활용·소각·매립 현황을 소비 신호와 교차 검증할 수 있습니다.', url: 'https://www.data.go.kr/data/15047172/fileData.do' },
  '전국 폐기물 발생 및 처리현황': { badge: '전국', badgeClass: 'source-public', detail: '한국환경공단 2024년 전국 원문을 시도별 요약으로 적재했습니다. BC카드 시군구 소비와는 시도 검증 레이어로 연결됩니다.', url: 'https://www.data.go.kr/data/3070174/fileData.do' },
  '전국 시군구 성 및 연령별 1인가구': { badge: 'CSV', badgeClass: 'source-public', detail: 'KOSIS 전국 시군구 원문 CSV를 적재해 전체 1인가구와 20~29세 1인가구를 함께 제공합니다.', url: 'https://kosis.kr/statisticsList/mass/mass_list.jsp?list_id=&org_id=101&process=statHtml&tbl_id=DT_1PL1502&vw_cd=' },
  '서울특별시 강서구 행정동별 1인가구 현황': { badge: 'XLSX', badgeClass: 'source-public', detail: '공공데이터포털 원문 XLSX를 서버에 적재해 행정동별 실제 1인가구 수를 제공합니다.', url: 'https://www.data.go.kr/data/15107625/fileData.do' },
  '전국대학및전문대학정보표준데이터': { badge: 'API', badgeClass: 'source-public', detail: '공공데이터포털 REST API에서 대학 목록을 조회해 생활권 주변 교육 인프라를 표시합니다.' },
  '무인 회수기 좌표': { badge: 'MAP', badgeClass: 'source-plan', detail: '정책 후보지 주변의 시설 공백을 지도 레이어로 확인합니다.' },
}

function statusLabel(status) {
  return { connected: '연결됨', configured: '키 설정됨', catalogued: '원문 확인', pending: '연동 대기', error: '호출 오류' }[status] || status
}

export default function CatalogPage() {
  const [health, setHealth] = useState(null)
  const [sources, setSources] = useState([])
  useEffect(() => {
    Promise.all([fetch('/api/health').then((response) => response.json()), fetch('/api/sources').then((response) => response.json())])
      .then(([apiHealth, sourcePayload]) => { setHealth(apiHealth); setSources(sourcePayload.sources || []) })
      .catch(() => setHealth({ ok: false }))
  }, [])
  return <main className="page-main"><section className="page-hero catalog-hero"><div><span className="eyebrow">DATA CATALOG</span><h1>정책 신호의<br /><em>근거를 추적</em>하세요.</h1><p>연결된 데이터의 출처, 공간 단위, 갱신 상태를 한 화면에서 확인합니다.</p></div><div className="api-health"><span className={health?.ok ? 'health-dot online' : 'health-dot'} /><span>INFRA-LENS API</span><strong>{health?.ok ? 'ONLINE' : 'FALLBACK MODE'}</strong><small>{health?.generatedAt ? '집계 레이어 응답 정상' : '서버 연결 대기'}</small></div></section><section className="catalog-grid">{sources.map((source) => { const detail = sourceDetails[source.name] || {}; return <article className="panel source-card-large" key={source.name}><div className="source-card-head"><span className={`source-badge ${detail.badgeClass || 'source-plan'}`}>{detail.badge || 'API'}</span><span className={`source-state ${source.status}`}>{statusLabel(source.status)}</span></div><h2>{source.name}</h2><p className="source-provider">{source.provider}</p><p className="source-detail">{detail.detail || '공공데이터 원천 상태를 확인합니다.'}</p><div className="source-card-foot"><span>{source.scope}{source.count ? ` · ${source.count.toLocaleString()}건 확인` : ''}</span>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">원문 보기 <Icon name="external" size={13} /></a> : <span className="source-muted">공공데이터포털 연계 대기</span>}</div></article> })}</section><section className="panel catalog-method"><div><span className="eyebrow">MODEL NOTE</span><h2>현재 지표는 정책 판단을 위한<br />초기 스크리닝 모델입니다.</h2></div><div className="method-steps"><div><strong>01</strong><span>소비 데이터</span><p>20대·시군구·업종별 금액과 건수 집계</p></div><div><strong>02</strong><span>취약도 계산</span><p>편의점 ÷ (편의점 + 신선 유통)</p></div><div><strong>03</strong><span>공공 검증</span><p>폐기물·1인가구·시설 좌표 레이어 교차</p></div></div></section></main>
}
