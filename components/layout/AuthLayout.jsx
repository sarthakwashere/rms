'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { isAuthenticated } from '@/lib/auth/session';
export default function AuthLayout({
  children,
  topbarActions
}) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', {
      replace: true
    });
  }, [navigate]);
  return <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar actions={topbarActions} />
        <main className="page-content">{children}</main>
      </div>
    </div>;
}
