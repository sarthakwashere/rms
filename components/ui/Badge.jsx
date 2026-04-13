import clsx from 'clsx';
export function Badge({
  value
}) {
  return <span className={clsx('badge', `badge-${String(value).toLowerCase()}`)}>
      {value}
    </span>;
}
export function StatusDot({
  status
}) {
  const tone = status?.toLowerCase();
  const color = tone === 'available' ? 'var(--emerald)' : tone === 'busy' || tone === 'active' ? 'var(--amber)' : tone === 'blocked' || tone === 'error' ? 'var(--rose)' : 'var(--muted)';
  return <span title={status} style={{
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
    background: color
  }} />;
}
export function UtilBar({
  pct
}) {
  const value = Math.max(0, Math.min(100, pct));
  const color = value >= 90 ? 'var(--rose)' : value >= 75 ? 'var(--amber)' : 'var(--emerald)';
  return <div style={{
    width: 42,
    height: 5,
    borderRadius: 999,
    background: 'rgba(30,42,66,0.65)',
    overflow: 'hidden'
  }}>
      <div style={{
      width: `${value}%`,
      height: '100%',
      background: color
    }} />
    </div>;
}
export function StatusBadge({
  status
}) {
  return <span className={clsx('badge', `badge-${status.toLowerCase()}`)}>
      {status}
    </span>;
}
export function SeverityBadge({
  severity
}) {
  const icons = {
    critical: '●',
    high: '▲',
    medium: '◆',
    low: '○'
  };
  return <span className={clsx('badge', `badge-${severity}`)}>
      {icons[severity]} {severity}
    </span>;
}
export function ResourceBadge({
  type
}) {
  const map = {
    GATE: 'gate',
    STAND: 'stand',
    BELT: 'belt',
    RUNWAY_ARR: 'runway',
    RUNWAY_DEP: 'runway',
    CHECKIN_DESK: 'stand'
  };
  return <span className={clsx('badge', `badge-${map[type] || 'stand'}`)}>
      {type}
    </span>;
}
