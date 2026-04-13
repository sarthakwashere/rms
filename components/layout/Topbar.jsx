'use client';

import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
const TITLES = {
  '/gantt': 'Gantt Chart',
  '/dashboard': 'Dashboard',
  '/conflicts': 'Conflicts',
  '/rules': 'Allocation Rules',
  '/constraints': 'Constraints',
  '/templates': 'Templates',
  '/simulations': 'Simulations',
  '/history': 'History',
  '/reports': 'Reports'
};
export default function Topbar({
  actions
}) {
  const {
    pathname
  } = useLocation();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <header className="topbar">
      <div style={{
      flex: 1
    }}>
        <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--bright)',
        letterSpacing: '0.04em'
      }}>{TITLES[pathname] || 'RMS'}</span>
      </div>
      {actions && <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>{actions}</div>}
      <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginLeft: 12
    }}>
        <span className="status-dot live" />
        <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--muted)'
      }}>{format(now, 'HH:mm:ss')}</span>
        <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'rgba(139,156,191,0.4)'
      }}>{format(now, 'dd MMM yyyy')}</span>
      </div>
    </header>;
}
