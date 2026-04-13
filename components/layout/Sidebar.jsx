'use client';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearSession, getUser } from '@/lib/auth/session';
const NAV = [{
  section: 'Visualization',
  items: [{
    href: '/gantt',
    label: 'Gantt Chart',
    icon: '▦'
  }, {
    href: '/dashboard',
    label: 'Dashboard',
    icon: '◈'
  }]
}, {
  section: 'Management',
  items: [{
    href: '/conflicts',
    label: 'Conflicts',
    icon: '◉'
  }, {
    href: '/rules',
    label: 'Rules',
    icon: '◧'
  }, {
    href: '/constraints',
    label: 'Constraints',
    icon: '⊞'
  }, {
    href: '/templates',
    label: 'Templates',
    icon: '⊟'
  }]
}, {
  section: 'Analysis',
  items: [{
    href: '/simulations',
    label: 'Simulations',
    icon: '⊛'
  }, {
    href: '/history',
    label: 'History',
    icon: '◷'
  }, {
    href: '/reports',
    label: 'Reports',
    icon: '◼'
  }]
}];
export default function Sidebar() {
  const {
    pathname
  } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser(getUser());
  }, []);
  return <aside className="sidebar">
      <div style={{
      padding: '0 16px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      gap: 10
    }}>
        <div style={{
        width: 32,
        height: 32,
        background: 'var(--cyan)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--bg)',
        fontFamily: 'var(--font-display)'
      }}>R</div>
        <div>
          <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--bright)',
          letterSpacing: '0.05em'
        }}>RMS</div>
          <div style={{
          fontSize: 10,
          color: 'var(--muted)',
          letterSpacing: '0.08em'
        }}>RESOURCE MGMT</div>
        </div>
      </div>
      <nav style={{
      flex: 1,
      overflowY: 'auto',
      padding: '8px 0'
    }}>
        {NAV.map(({
        section,
        items
      }) => <div key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map(({
          href,
          label,
          icon
        }) => <Link key={href} to={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
                <span style={{
            fontSize: 16,
            width: 20,
            textAlign: 'center',
            flexShrink: 0
          }}>{icon}</span>
                <span>{label}</span>
              </Link>)}
          </div>)}
      </nav>
      <div style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--border)'
    }}>
        {user && <div style={{
        marginBottom: 10
      }}>
            <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--bright)'
        }}>{user.display_name}</div>
            <div style={{
          fontSize: 11,
          color: 'var(--muted)'
        }}>{user.email}</div>
            <div style={{
          marginTop: 4
        }}><span className="badge badge-muted" style={{
            fontSize: 9
          }}>{user.role}</span></div>
          </div>}
        <button onClick={() => {
        clearSession();
        navigate('/login');
      }} className="btn btn-ghost" style={{
        width: '100%',
        justifyContent: 'center',
        fontSize: 12
      }}>Sign Out</button>
      </div>
    </aside>;
}
