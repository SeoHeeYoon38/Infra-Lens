import SectionTitle from './SectionTitle'
import { formatWon } from '../../utils/formatters'
import { getRisk } from '../../utils/risk'

export default function CategoryBars({ region }) {
  const convenience = region.categories?.편의점?.amt ?? 0
  const fresh = (region.categories?.슈퍼마켓?.amt ?? 0) + (region.categories?.대형할인점?.amt ?? 0)
  const risk = getRisk(region)
  const max = Math.max(convenience, fresh, 1)
  const rows = [
    { label: '편의점 대체 소비', value: convenience, color: '#d96758' },
    { label: '신선 유통 소비', value: fresh, color: '#4f8f86' },
  ]
  const visibleRows = rows.filter((row) => row.value > 0)
  return <section className="panel category-panel"><SectionTitle eyebrow="DECISION EVIDENCE" title="왜 이 지역을 우선 검토하나요?" meta="최근 6개월 누계" /><div className="decision-score"><strong>{risk}%</strong><span>편의점 집중도</span><em>{risk >= 65 ? '즉시 검토' : risk >= 50 ? '현장 확인' : '추적 관찰'}</em></div><div className="category-bars">{visibleRows.length ? visibleRows.map((row) => <div className="category-row" key={row.label}><div className="category-name"><i style={{ background: row.color }} />{row.label}</div><div className="category-track"><span style={{ width: `${(row.value / max) * 100}%`, background: row.color }} /></div><strong>{formatWon(row.value)}</strong></div>) : <p className="category-empty">비교할 소비 데이터가 없습니다.</p>}</div><div className="category-note"><span className="note-icon">→</span> 편의점 소비가 신선 유통을 대체할수록 회수·분리배출 거점 우선순위를 높입니다.</div></section>
}
