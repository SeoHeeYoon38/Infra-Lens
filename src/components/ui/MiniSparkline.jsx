export default function MiniSparkline({ values = [], color = '#ff7262' }) {
  if (!values.length) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
    const y = 24 - ((value - min) / Math.max(max - min, 1)) * 18
    return `${x},${y}`
  }).join(' ')
  return <svg className="mini-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
}
