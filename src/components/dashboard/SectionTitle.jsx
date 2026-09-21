export default function SectionTitle({ eyebrow, title, meta, action }) {
  return <div className="section-title-row"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><div className="section-meta">{meta && <span>{meta}</span>}{action}</div></div>
}
