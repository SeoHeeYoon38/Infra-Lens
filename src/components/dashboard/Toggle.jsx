export default function Toggle({ label, checked, onChange, color }) {
  return <label className="layer-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-dot" style={{ background: color }} /><span>{label}</span></label>
}
