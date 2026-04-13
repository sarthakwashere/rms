'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import AuthLayout from '@/components/rms/AuthLayout';
import { SeverityBadge } from '@/components/ui/Badge';
import { swrFetcher, SWR } from '@/lib/api/client';
import { CheckCircle, RefreshCw, Search } from 'lucide-react';
const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};
export default function ConflictsPage() {
  const {
    data: conflicts = [],
    isLoading,
    mutate
  } = useSWR(SWR.conflicts, swrFetcher, {
    refreshInterval: 30000
  });
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const filtered = useMemo(() => {
    return conflicts.filter(c => {
      const matchSearch = !search || c.conflict_description.toLowerCase().includes(search.toLowerCase()) || c.conflict_type.toLowerCase().includes(search.toLowerCase());
      const matchSev = sevFilter === 'all' || c.severity === sevFilter;
      return matchSearch && matchSev;
    }).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [conflicts, search, sevFilter]);
  const critCount = conflicts.filter(c => c.severity === 'critical').length;
  const highCount = conflicts.filter(c => c.severity === 'high').length;
  return <AuthLayout title="Conflict Management">
      {/* Header */}
      <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    }}>
        <div className="page-header" style={{
        marginBottom: 0
      }}>
          <div className="page-title">Conflict Management</div>
          <div className="page-sub">{conflicts.length} open conflicts · {critCount} critical</div>
        </div>
        <button onClick={() => mutate()} className="btn btn-sm btn-secondary">
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '20px'
    }}>
        {['critical', 'high', 'medium', 'low'].map(sev => {
        const count = conflicts.filter(c => c.severity === sev).length;
        const colorMap = {
          critical: 'red',
          high: 'amber',
          medium: 'amber',
          low: 'green'
        };
        return <button key={sev} onClick={() => setSevFilter(f => f === sev ? 'all' : sev)} className={`stat-card ${colorMap[sev]} ${sevFilter === sev ? 'card-glow-blue' : ''}`} style={{
          border: sevFilter === sev ? '1px solid var(--accent-blue)' : '',
          cursor: 'pointer',
          textAlign: 'left'
        }}>
              <div className="stat-value" style={{
            fontSize: '2rem',
            color: sev === 'critical' ? 'var(--accent-red)' : sev === 'low' ? 'var(--accent-green)' : 'var(--accent-amber)'
          }}>
                {count}
              </div>
              <div className="stat-label" style={{
            textTransform: 'capitalize'
          }}>{sev}</div>
            </button>;
      })}
      </div>

      {/* Search + table */}
      <div className="card" style={{
      overflow: 'hidden'
    }}>
        <div className="card-header">
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1
        }}>
            <Search size={15} style={{
            color: 'var(--text-muted)'
          }} />
            <input className="field-input" style={{
            flex: 1,
            maxWidth: '360px'
          }} placeholder="Search conflicts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>{filtered.length} results</span>
        </div>

        {isLoading ? <div style={{
        padding: '60px',
        textAlign: 'center'
      }}><div className="spinner" style={{
          margin: 'auto'
        }} /></div> : filtered.length === 0 ? <div className="empty-state">
            <CheckCircle size={36} color="var(--accent-green)" />
            <p style={{
          marginTop: '12px',
          color: 'var(--text-secondary)'
        }}>
              {conflicts.length === 0 ? 'No active conflicts — all clear!' : 'No conflicts match filters'}
            </p>
          </div> : <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Resource</th>
                <th>Description</th>
                <th>Detected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => <tr key={c.conflict_id}>
                  <td><SeverityBadge severity={c.severity} /></td>
                  <td>
                    <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                      {c.conflict_type}
                    </span>
                  </td>
                  <td>
                    {c.resource_type ? (
                      <span className="code">
                        {c.resource_type}
                        {(c.resource_id || c.resourceId) && ` · ${c.resource_id || c.resourceId}`}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td style={{
              maxWidth: '400px'
            }}>
                    <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                      {c.conflict_description}
                    </span>
                  </td>
                  <td style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}>
                    {format(parseISO(c.detected_at), 'dd MMM HH:mm')}
                  </td>
                  <td>
                    <span className={`badge badge-${c.status === 'open' ? 'planned' : c.status === 'acknowledged' ? 'active' : 'confirmed'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>)}
            </tbody>
          </table>}
      </div>
    </AuthLayout>;
}
