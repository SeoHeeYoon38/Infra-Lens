import SectionTitle from './SectionTitle'
import { categoryColors } from '../../data/categoryColors'
import { formatWon } from '../../utils/formatters'

export default function CategoryBars({ region }) {
  const categories = Object.entries(region.categories ?? {}).sort(([, a], [, b]) => b.amt - a.amt).slice(0, 6)
  const max = categories[0]?.[1].amt || 1
  return <section className="panel category-panel"><SectionTitle eyebrow="CONSUMPTION MIX" title="업종별 소비 구성" meta="최근 6개월 누계" /><div className="category-bars">{categories.map(([name, value]) => <div className="category-row" key={name}><div className="category-name"><i style={{ background: categoryColors[name] ?? '#8ea3b7' }} />{name}</div><div className="category-track"><span style={{ width: `${(value.amt / max) * 100}%`, background: categoryColors[name] ?? '#8ea3b7' }} /></div><strong>{formatWon(value.amt)}</strong></div>)}</div><div className="category-note"><span className="note-icon">i</span> 편의점·대형 유통 소비를 비교해 생활권 자급력을 추정합니다.</div></section>
}
