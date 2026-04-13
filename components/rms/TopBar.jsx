'use client';

import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';
const PAGE_TITLES = {
  '/dashboard': 'Operations Dashboard',
  '/gantt': 'Gantt Timeline',
  '/conflicts': 'Conflict Management',
  '/rules': 'Allocation Rules',
  '/constraints': 'Constraints',
  '/templates': 'Templates',
  '/simulations': 'Simulations',
  '/history': 'Allocation History',
  '/reports': 'Reports & Analytics'
};
export default function TopBar({
  title,
  collapsed
}) {
  const { pathname } = useLocation();
  const pageTitle = title || PAGE_TITLES[pathname || ''] || 'RMS';
  return <header className="rms-topbar">
      <div style={{
      flex: 1
    }}>
        <span style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }}>
          {pageTitle}
        </span>
      </div>

      <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <div className="dot-live" />
          <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em'
        }}>
            {format(new Date(), 'dd MMM yyyy HH:mm')} UTC
          </span>
        </div>

        <button style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: '6px'
      }}>
          <Bell size={16} />
        </button>
      </div>
    </header>;
}
