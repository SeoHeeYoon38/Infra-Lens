import Icon from '../ui/Icon'

export default function DataSources() {
  return <aside className="source-strip"><div className="source-title"><span className="eyebrow">DATA CATALOG</span><strong>연결된 데이터 출처</strong></div><div className="source-items"><a href="https://www.data.go.kr/data/15047172/fileData.do" target="_blank" rel="noreferrer"><span className="source-badge source-public">공공</span><span>서울 생활폐기물 발생량 및 처리현황</span><Icon name="external" size={13} /></a><div><span className="source-badge source-card">BC</span><span>ABP_CONTEST_DATA · 20대 소비 집계</span><span className="source-live"><i /> 연결됨</span></div><div><span className="source-badge source-public">CSV</span><span>전국 시군구 1인가구 · KOSIS 2025</span><span className="source-live"><i /> 연결됨</span></div><div><span className="source-badge source-public">API</span><span>전국 대학 표준데이터</span><span className="source-live"><i /> 연결됨</span></div></div></aside>
}
