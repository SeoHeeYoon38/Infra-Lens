import Icon from '../ui/Icon'
import MiniSparkline from '../ui/MiniSparkline'

export default function MetricCard({ label, value, caption, accent, sparkline, icon }) {
  return <article className="metric-card" style={{ '--metric-accent': accent }}><div className="metric-head"><span className="metric-label">{label}</span><span className="metric-icon"><Icon name={icon} size={16} /></span></div><strong className="metric-value">{value}</strong><div className="metric-foot"><span>{caption}</span>{sparkline && <MiniSparkline values={sparkline} color={accent} />}</div></article>
}
