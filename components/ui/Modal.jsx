'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer
}) {
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onClick={e => {
    if (e.target === e.currentTarget) onClose();
  }}>
      <div className={`modal-panel ${size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : ''}`}>
        <div className="modal-header">
          <div>
            <div style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)'
          }}>{title}</div>
            {subtitle && <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginTop: '2px'
          }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '4px'
        }}>
            <X size={18} />
          </button>
        </div>
        <div style={{
        padding: '24px',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
          {children}
        </div>
        {footer && <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
            {footer}
          </div>}
      </div>
    </div>;
}
