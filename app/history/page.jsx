'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import AuthLayout from '@/components/rms/AuthLayout';
import { StatusBadge, ResourceBadge } from '@/components/ui/Badge';
import { swrFetcher, SWR } from '@/lib/api/client';
import { Search } from 'lucide-react';
export default function HistoryPage() {
  const {
    data: allocs = [],
    isLoading
  } = useSWR(SWR.allocations, swrFetcher);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = allocs.filter(a => {
    const matchSearch = !search || a.resource_id.toLowerCase().includes(search.toLowerCase()) || a.flight_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });
  return <AuthLayout title="Allocation History">
      <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    }}>
        <div className="page-header" style={{
        marginBottom: 0
      }}>
          <div className="page-title">Allocation History</div>
          <div className="page-sub">Full audit trail of all resource allocations</div>
        </div>
      </div>

      <div className="card" style={{
      overflow: 'hidden'
    }}>
        <div className="card-header" style={{
        gap: '12px',
        flexWrap: 'wrap'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1
        }}>
            <Search size={14} style={{
            color: 'var(--text-muted)'
          }} />
            <input className="field-input" style={{
            maxWidth: '300px'
          }} placeholder="Search by flight or resource..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field-select" style={{
          width: 'auto'
        }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="RELEASED">Released</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>{filtered.length} records</span>
        </div>

        {isLoading ? <div style={{
        padding: '60px',
        textAlign: 'center'
      }}><div className="spinner" style={{
          margin: 'auto'
        }} /></div> : <table className="data-table">
            <thead>
              <tr>
                <th>Allocation ID</th>
                <th>Flight</th>
                <th>Resource</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(a => <tr key={a.allocation_id}>
                  <td><span className="code">{a.allocation_id.slice(0, 8)}…</span></td>
                  <td><span className="code">{a.flight_id.slice(0, 8)}…</span></td>
                  <td style={{
              fontWeight: 600
            }}>{a.resource_id}</td>
                  <td><ResourceBadge type={a.resource_type} /></td>
                  <td style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
                    {format(parseISO(a.start_time), 'dd MMM HH:mm')}
                  </td>
                  <td style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
                    {format(parseISO(a.end_time), 'dd MMM HH:mm')}
                  </td>
                  <td style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>{a.allocation_mode}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}>
                    {format(parseISO(a.created_at), 'dd MMM HH:mm')}
                  </td>
                </tr>)}
            </tbody>
          </table>}
      </div>
    </AuthLayout>;
}
