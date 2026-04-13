export default function EmptyState({
  icon = '◌',
  title,
  message,
  action
}) {
  return <div style={{
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--muted)'
  }}>
      <div style={{
      fontSize: 40,
      marginBottom: 12,
      opacity: 0.4
    }}>{icon}</div>
      <div style={{
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: 6
    }}>{title}</div>
      {message && <div style={{
      fontSize: 13,
      marginBottom: 16
    }}>{message}</div>}
      {action && <button className="btn btn-ghost" onClick={action.onClick}>{action.label}</button>}
    </div>;
}
