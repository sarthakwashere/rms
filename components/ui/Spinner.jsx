export default function Spinner({
  size = 18
}) {
  return <div className="spinner" style={{
    width: size,
    height: size
  }} />;
}
export function PageSpinner() {
  return <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300
  }}>
      <div style={{
      textAlign: 'center'
    }}>
        <div className="spinner" style={{
        width: 32,
        height: 32,
        margin: '0 auto 12px'
      }} />
        <div style={{
        fontSize: 12,
        color: 'var(--muted)'
      }}>Loading...</div>
      </div>
    </div>;
}
