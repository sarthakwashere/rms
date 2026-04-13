'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import AuthLayout from '@/components/rms/AuthLayout';
import { swrFetcher, SWR } from '@/lib/api/client';
const COLORS = ['#4b6cf3', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
export default function ReportsPage() {
  const {
    data: allocs = [],
    isLoading
  } = useSWR(SWR.allocations, swrFetcher);
  const byType = useMemo(() => {
    const map = {};
    allocs.forEach(a => {
      map[a.resource_type] = (map[a.resource_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [allocs]);
  const byStatus = useMemo(() => {
    const map = {};
    allocs.forEach(a => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [allocs]);
  const byMode = useMemo(() => {
    const map = {};
    allocs.forEach(a => {
      map[a.allocation_mode] = (map[a.allocation_mode] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [allocs]);
  const autoRate = allocs.length > 0 ? (allocs.filter(a => a.allocation_mode === 'AUTO').length / allocs.length * 100).toFixed(1) : '0';
  return <AuthLayout title="Reports & Analytics">
      <div style={{
      marginBottom: '24px'
    }}>
        <div className="page-title">Reports & Analytics</div>
        <div className="page-sub">Allocation performance summary</div>
      </div>

      {/* Summary */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '24px'
    }}>
        {[{
        label: 'Total Allocations',
        value: allocs.length,
        color: '#4b6cf3'
      }, {
        label: 'Auto-Allocation Rate',
        value: `${autoRate}%`,
        color: '#22c55e'
      }, {
        label: 'Unique Resources',
        value: new Set(allocs.map(a => a.resource_id)).size,
        color: '#06b6d4'
      }, {
        label: 'Unique Flights',
        value: new Set(allocs.map(a => a.flight_id)).size,
        color: '#a855f7'
      }].map(s => <div key={s.label} className="stat-card blue" style={{
        borderTopColor: s.color
      }}>
            <div className="stat-value" style={{
          color: s.color
        }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>)}
      </div>

      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px'
    }}>
        <div className="card">
          <div className="card-header"><span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>By Resource Type</span></div>
          <div style={{
          padding: '16px'
        }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byType} margin={{
              left: -28
            }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{
                fontSize: 9,
                fill: '#4a5468'
              }} />
                <YAxis tick={{
                fontSize: 9,
                fill: '#4a5468'
              }} />
                <Tooltip contentStyle={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)'
              }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>By Status</span></div>
          <div style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" strokeWidth={0}>
                  {byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)'
              }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{
          padding: '0 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
            {byStatus.map(s => <div key={s.name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.72rem'
          }}>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                  <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: s.color
              }} />
                  <span style={{
                color: 'var(--text-secondary)'
              }}>{s.name}</span>
                </div>
                <span style={{
              color: 'var(--text-primary)',
              fontWeight: 600
            }}>{s.value}</span>
              </div>)}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>By Mode</span></div>
          <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
            {byMode.map(m => {
            const pct = allocs.length > 0 ? m.value / allocs.length * 100 : 0;
            return <div key={m.name}>
                  <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '0.78rem'
              }}>
                    <span style={{
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}>{m.name}</span>
                    <span style={{
                  color: 'var(--text-primary)'
                }}>{m.value} <span style={{
                    color: 'var(--text-muted)'
                  }}>({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: m.color
                }} />
                  </div>
                </div>;
          })}
          </div>
        </div>
      </div>
    </AuthLayout>;
}
