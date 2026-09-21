import Icon from '../ui/Icon'
import SectionTitle from './SectionTitle'
import { formatCount, formatWon } from '../../utils/formatters'
import { getRisk, riskLabel, riskTone } from '../../utils/risk'

export default function InsightPanel({ region, onGenerateReport, report, reportLoading }) {
  const risk = getRisk(region)
  const convenience = region.categories?.편의점?.amt ?? 0
  const fresh = (region.categories?.슈퍼마켓?.amt ?? 0) + (region.categories?.대형할인점?.amt ?? 0)
  const ratio = (convenience / Math.max(fresh, 1)).toFixed(1)

  return <section className="panel insight-panel"><SectionTitle eyebrow="POLICY SIGNAL" title="정책 결론" meta={<span className={`risk-pill ${riskTone(risk)}`}><i /> {riskLabel(risk)}</span>} /><div className="signal-score"><div className="score-ring" style={{ '--score': `${risk * 3.6}deg` }}><strong>{risk}</strong><span>/ 100</span></div><div className="score-copy"><strong>생활권 자급력 취약 추정</strong><p>편의점 소비가 대형 유통보다 <b>{ratio}배</b> 높습니다.</p></div></div><div className="insight-list"><div><span>편의점 소비</span><strong>{formatWon(convenience)}</strong><small>{formatCount(region.categories?.편의점?.cnt)}건</small></div><div><span>신선식품 대체 소비</span><strong>{formatWon(fresh)}</strong><small>슈퍼·대형 유통 합산</small></div><div><span>1인가구</span><strong>{region.singleHouseholds ? `${region.singleHouseholds.toLocaleString()}가구` : '매칭 대기'}</strong><small>{region.householdYear ? `KOSIS ${region.householdYear}` : '전국 시군구 원천'}</small></div></div><div className="insight-callout"><span className="callout-icon"><Icon name="signal" size={17} /></span><p><b>{region.district}</b>은 소비와 주거 규모를 함께 보고 회수 인프라 우선순위를 정할 후보지입니다.</p></div><button type="button" className="primary-action" onClick={onGenerateReport} disabled={reportLoading}><Icon name="download" size={16} /> {reportLoading ? '리포트 생성 중…' : '정책 제안 리포트 생성'}</button>{report && <div id="policy-report-result" className="report-result" aria-live="polite"><span className="report-kicker">POLICY DECISION</span><h3>{report.decision}</h3><p>{report.summary}</p><div className="report-columns"><div><strong>판정 근거</strong><ul>{report.evidence?.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>권고 조치</strong><ul>{report.actions?.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}</section>
}
