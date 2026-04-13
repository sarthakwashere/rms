'use client';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '@/lib/auth/session';
import { LayoutDashboard, Calendar, AlertTriangle, Settings, FileText, Layers, Activity, BookOpen, BarChart2, ChevronLeft, ChevronRight, LogOut, Cpu } from 'lucide-react';
const NAV = [{
  section: 'OPERATIONS',
  items: [{
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  }, {
    href: '/gantt',
    label: 'Gantt View',
    icon: Calendar
  }]
}, {
  section: 'MANAGEMENT',
  items: [{
    href: '/allocations',
    label: 'Allocations',
    icon: Layers
  }, {
    href: '/conflicts',
    label: 'Conflicts',
    icon: AlertTriangle
  }, {
    href: '/rules',
    label: 'Rules',
    icon: Settings
  }, {
    href: '/constraints',
    label: 'Constraints',
    icon: Layers
  }, {
    href: '/templates',
    label: 'Templates',
    icon: FileText
  }]
}, {
  section: 'ANALYSIS',
  items: [{
    href: '/simulations',
    label: 'Simulations',
    icon: Activity
  }, {
    href: '/history',
    label: 'History',
    icon: BookOpen
  }, {
    href: '/reports',
    label: 'Reports',
    icon: BarChart2
  }]
}];
export default function Sidebar({
  collapsed,
  onToggle
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  function handleLogout() {
    clearSession();
    navigate('/login');
  }
  return <nav className={`rms-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div style={{
      padding: '0 16px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)'
    }}>
        {!collapsed && <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <div style={{
          width: '28px',
          height: '28px',
          background: 'var(--accent-blue)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
              <Cpu size={15} color="#12121e" />
            </div>
            <div>
              <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '0.06em',
            color: 'var(--text-primary)'
          }}>RMS</div>
              <div style={{
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>Resource Mgmt · v3</div>
            </div>
          </div>}
        {collapsed && <div style={{
        width: '28px',
        height: '28px',
        background: 'var(--accent-blue)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'auto'
      }}>
            <Cpu size={15} color="#12121e" />
          </div>}
        {!collapsed && <button onClick={onToggle} style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: '4px'
      }}>
            <ChevronLeft size={16} />
          </button>}
      </div>

      {/* Navigation */}
      <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '12px 0'
    }}>
        {NAV.map(({
        section,
        items
      }) => <div key={section} style={{
        marginBottom: '8px'
      }}>
            {!collapsed && <div style={{
          padding: '8px 16px 4px',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}>
                {section}
              </div>}
            {items.map(({
          href,
          label,
          icon: Icon
        }) => {
          const active = pathname === href || href !== '/' && pathname?.startsWith(href);
          return <Link key={href} to={href} title={collapsed ? label : undefined} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '11px 0' : '9px 13px 9px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            margin: '1px 8px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: active ? 'rgba(253, 224, 71, 0.12)' : 'transparent',
            borderLeft: active ? '3px solid var(--accent-blue)' : '3px solid transparent',
            transition: 'all 0.15s'
          }} onMouseEnter={e => {
            if (!active) e.currentTarget.style.background = 'var(--surface-3)';
          }} onMouseLeave={e => {
            if (!active) e.currentTarget.style.background = 'transparent';
          }}>
                  <Icon size={15} style={{
              flexShrink: 0
            }} />
                  {!collapsed && <span>{label}</span>}
                </Link>;
        })}
          </div>)}
      </div>

      {/* User + Logout */}
      <div style={{
      borderTop: '1px solid var(--border)',
      padding: '12px 8px'
    }}>
        {!collapsed && session && <div style={{
        padding: '8px 12px',
        marginBottom: '4px'
      }}>
            <div style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
              {session.name || session.email}
            </div>
            <div style={{
          fontSize: '0.67rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
              {session.role || 'operator'}
            </div>
          </div>}
        <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '11px 0' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        background: 'transparent',
        transition: 'all 0.15s'
      }} onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
        e.currentTarget.style.color = '#f87171';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}>
          <LogOut size={15} style={{
          flexShrink: 0
        }} />
          {!collapsed && 'Logout'}
        </button>
        {collapsed && <button onClick={onToggle} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '9px',
        width: '100%',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        color: 'var(--text-muted)',
        marginTop: '4px'
      }}>
            <ChevronRight size={14} />
          </button>}
      </div>
    </nav>;
}
