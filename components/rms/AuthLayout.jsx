'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth/session';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
export default function AuthLayout({
  children,
  title
}) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      setChecked(true);
    }
  }, [navigate]);
  if (!checked) {
    return <div style={{
      minHeight: '100vh',
      background: 'var(--surface-0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        <div className="spinner" />
      </div>;
  }
  return <div className="rms-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`rms-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar title={title} collapsed={collapsed} />
        <main className="rms-main">
          {children}
        </main>
      </div>
    </div>;
}
