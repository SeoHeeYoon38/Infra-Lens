import SectionTitle from './SectionTitle'
import { formatCount, formatMonth, formatWon } from '../../utils/formatters'

export default function TrendPanel({ region }) {
  const values = region.monthly?.map((item) => item.amt) ?? []
  const dataMin = values.length ? Math.min(...values) : 0
  const dataMax = values.length ? Math.max(...values) : 1
  const range = Math.max(dataMax - dataMin, 1)
  const min = Math.max(0, dataMin - range * .18)
  const max = dataMax + range * .18
  const points = values.map((value, index) => { const x = values.length === 1 ? 50 : 7 + (index / (values.length - 1)) * 86; const y = 13 - ((value - min) / Math.max(max - min, 1)) * 8; return { x, y, value } })
  return <section className="panel trend-panel"><SectionTitle eyebrow="MONTHLY SIGNAL" title="소비 흐름" meta={region.monthly?.length ? `${formatMonth(region.monthly[0].month)} — ${formatMonth(region.monthly.at(-1).month)}` : ''} /><div className="trend-chart-wrap"><svg viewBox="0 0 100 16" className="trend-chart" role="img" aria-label="최근 6개월 소비 금액 추이">{[3, 8, 13].map((y) => <line key={y} x1="7" x2="93" y1={y} y2={y} className="chart-grid" />)}<polyline points={points.map(({ x, y }) => `${x},${y}`).join(' ')} className="trend-line" />{points.map(({ x, y, value }, index) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".95" className="trend-point"><title>{formatMonth(region.monthly[index].month)} · {formatWon(value)}</title></circle>)}</svg><div className="trend-labels">{region.monthly?.map((item) => <span key={item.month}>{Number(item.month.slice(4))}월</span>)}</div></div><div className="trend-summary"><span>최근월 결제건수</span><strong>{formatCount(region.monthly?.at(-1)?.cnt)}건</strong><span className="trend-up">+6.2%</span></div></section>
}
