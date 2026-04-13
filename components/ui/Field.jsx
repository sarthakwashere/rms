export function Field({
  label,
  error,
  hint,
  children,
  required
}) {
  return <div style={{
    marginBottom: 14
  }}>
      <label className="field-label">{label}{required && <span style={{
        color: 'var(--rose)',
        marginLeft: 3
      }}>*</span>}</label>
      {children}
      {error && <div style={{
      fontSize: 11,
      color: 'var(--rose)',
      marginTop: 4
    }}>{error}</div>}
      {hint && !error && <div style={{
      fontSize: 11,
      color: 'var(--muted)',
      marginTop: 4
    }}>{hint}</div>}
    </div>;
}
export function Input(props) {
  return <input className="field-input" {...props} />;
}
export function Select({
  options,
  ...props
}) {
  return <select className="field-select" {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>;
}
export function Textarea(props) {
  return <textarea className="field-textarea" style={{
    resize: 'vertical',
    minHeight: 80
  }} {...props} />;
}
