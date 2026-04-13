'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import AuthLayout from '@/components/rms/AuthLayout';
import Modal from '@/components/ui/Modal';
import { StatusBadge, ResourceBadge } from '@/components/ui/Badge';
import { swrFetcher, AllocationAPI, SWR } from '@/lib/api/client';
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react';

function allocationRowId(a) {
  return a.allocation_id ?? a.allocationId;
}
const RESOURCE_TYPES = ['GATE', 'STAND', 'BELT', 'RUNWAY_ARR', 'RUNWAY_DEP', 'CHECKIN_DESK'];
export default function AllocationsPage() {
  const {
    data: allocs = [],
    isLoading,
    mutate
  } = useSWR(SWR.allocations, swrFetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    resource_type: 'GATE',
    force_override: false
  });
  const filtered = useMemo(() => allocs.filter(a => {
    const matchSearch = !search || a.resource_id.toLowerCase().includes(search.toLowerCase()) || a.flight_id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.resource_type === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [allocs, search, typeFilter, statusFilter]);
  async function handleCreate() {
    if (!form.flight_id || !form.resource_type || !form.resource_id || !form.start_time || !form.end_time) {
      setCreateError('All fields required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await AllocationAPI.create(form);
      setShowCreate(false);
      setForm({
        resource_type: 'GATE',
        force_override: false
      });
      mutate();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }
  async function handleRelease(id) {
    if (!confirm('Release this allocation?')) return;
    try {
      await AllocationAPI.release(id);
      mutate();
    } catch (e) {
      alert(e.message);
    }
  }
  async function handleDelete(a) {
    const id = allocationRowId(a);
    if (!id) return;
    if (!confirm('Permanently delete this allocation record? This cannot be undone.')) return;
    try {
      await AllocationAPI.delete(id);
      mutate();
    } catch (e) {
      alert(e.message);
    }
  }
  return <AuthLayout title="Allocations">
      <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    }}>
        <div className="page-header" style={{
        marginBottom: 0
      }}>
          <div className="page-title">Resource Allocations</div>
          <div className="page-sub">Manage gate, stand, belt and runway allocations</div>
        </div>
        <div style={{
        display: 'flex',
        gap: '8px'
      }}>
          <button onClick={() => mutate()} className="btn btn-sm btn-ghost"><RefreshCw size={12} /></button>
          <button onClick={() => setShowCreate(true)} className="btn btn-sm btn-primary"><Plus size={14} /> New Allocation</button>
        </div>
      </div>

      <div className="card" style={{
      overflow: 'hidden'
    }}>
        <div className="card-header" style={{
        flexWrap: 'wrap',
        gap: '10px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <Search size={14} style={{
            color: 'var(--text-muted)'
          }} />
            <input className="field-input" style={{
            maxWidth: '240px'
          }} placeholder="Search flight or resource..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field-select" style={{
          width: 'auto'
        }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="field-select" style={{
          width: 'auto'
        }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {['PLANNED', 'CONFIRMED', 'ACTIVE', 'RELEASED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{
          marginLeft: 'auto',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>{filtered.length} / {allocs.length}</span>
        </div>

        {isLoading ? <div style={{
        padding: '60px',
        textAlign: 'center'
      }}><div className="spinner" style={{
          margin: 'auto'
        }} /></div> : <div style={{
        overflowX: 'auto'
      }}>
            <table className="data-table">
              <thead><tr><th>Resource</th><th>Type</th><th>Flight</th><th>Start</th><th>End</th><th>Mode</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={8} style={{
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-muted)'
              }}>No allocations found</td></tr> : filtered.map(a => <tr key={allocationRowId(a)}>
                    <td style={{
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.83rem'
              }}>{a.resource_id}</td>
                    <td><ResourceBadge type={a.resource_type} /></td>
                    <td><span className="code">{a.flight_id.slice(0, 8)}…</span></td>
                    <td style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}>{format(parseISO(a.start_time), 'dd MMM HH:mm')}</td>
                    <td style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}>{format(parseISO(a.end_time), 'dd MMM HH:mm')}</td>
                    <td style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>{a.allocation_mode}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(a.status === 'PLANNED' || a.status === 'CONFIRMED') && (
                          <button type="button" onClick={() => handleRelease(allocationRowId(a))} className="btn btn-sm btn-danger">
                            Release
                          </button>
                        )}
                        {(a.status === 'RELEASED' || a.status === 'CANCELLED') && (
                          <button type="button" onClick={() => handleDelete(a)} className="btn btn-sm btn-ghost" title="Remove record">
                            <Trash2 size={14} style={{ verticalAlign: 'middle' }} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

      <Modal open={showCreate} onClose={() => {
      setShowCreate(false);
      setCreateError('');
    }} title="New Allocation" subtitle="Manually allocate a resource to a flight" footer={<>
          <button onClick={() => {
        setShowCreate(false);
        setCreateError('');
      }} className="btn btn-ghost">Cancel</button>
          <button onClick={handleCreate} className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Allocation'}</button>
        </>}>
        {createError && <div style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '16px',
        fontSize: '0.8rem',
        color: '#f87171'
      }}>{createError}</div>}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
          <div><label className="field-label">Flight ID</label><input className="field-input" placeholder="UUID of the flight" value={form.flight_id || ''} onChange={e => setForm(f => ({
            ...f,
            flight_id: e.target.value
          }))} /></div>
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
            <div><label className="field-label">Resource Type</label>
              <select className="field-select" value={form.resource_type} onChange={e => setForm(f => ({
              ...f,
              resource_type: e.target.value
            }))}>
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="field-label">Resource ID</label><input className="field-input" placeholder="e.g. GATE-A12" value={form.resource_id || ''} onChange={e => setForm(f => ({
              ...f,
              resource_id: e.target.value
            }))} /></div>
          </div>
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
            <div><label className="field-label">Start Time</label><input className="field-input" type="datetime-local" onChange={e => setForm(f => ({
              ...f,
              start_time: new Date(e.target.value).toISOString()
            }))} /></div>
            <div><label className="field-label">End Time</label><input className="field-input" type="datetime-local" onChange={e => setForm(f => ({
              ...f,
              end_time: new Date(e.target.value).toISOString()
            }))} /></div>
          </div>
          <div><label className="field-label">Notes (optional)</label><input className="field-input" placeholder="Optional notes" value={form.notes || ''} onChange={e => setForm(f => ({
            ...f,
            notes: e.target.value || undefined
          }))} /></div>
          <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
            <input type="checkbox" checked={form.force_override || false} onChange={e => setForm(f => ({
            ...f,
            force_override: e.target.checked
          }))} />
            Force override (ignore conflicts)
          </label>
        </div>
      </Modal>
    </AuthLayout>;
}
