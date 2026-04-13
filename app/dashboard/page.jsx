'use client';

import { useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import AuthLayout from '@/components/rms/AuthLayout';
import { StatusBadge, SeverityBadge, ResourceBadge } from '@/components/ui/Badge';
import { swrFetcher, EngineAPI, SWR } from '@/lib/api/client';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Play, RefreshCw, AlertTriangle, CheckCircle, Layers, Activity, Zap, Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
const CHART_COLORS = ['#fde047', '#22c55e', '#f59e0b', '#ef4444', '#22d3ee', '#a855f7'];
const WS_URL = typeof window !== 'undefined' ? import.meta.env.VITE_RMS_WS_URL || null : null;
export default function DashboardPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [wsEvents, setWsEvents] = useState([]);
  const {
    data: allocs = [],
    mutate: mutateAllocs,
    isLoading: loadingAllocs
  } = useSWR(SWR.allocations, swrFetcher, {
    refreshInterval: autoRefresh ? 30000 : 0
  });
  const {
    data: conflicts = [],
    mutate: mutateConflicts,
    isLoading: loadingConflicts
  } = useSWR(SWR.conflicts, swrFetcher, {
    refreshInterval: autoRefresh ? 30000 : 0
  });

  // WebSocket for live updates
  const handleWsMessage = useCallback(msg => {
    setWsEvents(prev => [{
      type: msg.type,
      desc: String(msg.payload?.description || msg.type),
      ts: msg.timestamp
    }, ...prev.slice(0, 9)]);
    // Refresh data on relevant events
    if (['allocation_created', 'allocation_released', 'conflict_detected'].includes(msg.type)) {
      mutateAllocs();
      mutateConflicts();
    }
  }, [mutateAllocs, mutateConflicts]);
  const {
    status: wsStatus
  } = useWebSocket(WS_URL, {
    onMessage: handleWsMessage,
    enabled: autoRefresh
  });

  // Compute stats
  const stats = useMemo(() => {
    const total = allocs.length;
    const byStatus = {};
    const byType = {};
    const byMode = {};
    allocs.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      byType[a.resource_type] = (byType[a.resource_type] || 0) + 1;
      byMode[a.allocation_mode] = (byMode[a.allocation_mode] || 0) + 1;
    });
    const openConflicts = conflicts.filter(c => c.status === 'open').length;
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    const autoAllocated = byMode['AUTO'] || 0;
    const autoRate = total > 0 ? Math.round(autoAllocated / total * 100) : 0;
    return {
      total,
      byStatus,
      byType,
      byMode,
      openConflicts,
      critical,
      autoAllocated,
      autoRate
    };
  }, [allocs, conflicts]);

  // Hourly distribution
  const hourlyData = useMemo(() => {
    const counts = Array.from({
      length: 24
    }, (_, h) => ({
      hour: h,
      count: 0,
      label: `${h.toString().padStart(2, '0')}:00`
    }));
    allocs.forEach(a => {
      try {
        const h = parseISO(a.start_time).getHours();
        counts[h].count++;
      } catch {}
    });
    return counts;
  }, [allocs]);

  // Resource type chart
  const typeData = useMemo(() => Object.entries(stats.byType).map(([name, value]) => ({
    name,
    value
  })), [stats.byType]);

  // Radar chart (performance dimensions)
  const radarData = useMemo(() => {
    const total = stats.total || 1;
    return [{
      subject: 'Confirmed',
      A: (stats.byStatus['CONFIRMED'] || 0) / total * 100,
      fullMark: 100
    }, {
      subject: 'Active',
      A: (stats.byStatus['ACTIVE'] || 0) / total * 100,
      fullMark: 100
    }, {
      subject: 'Auto-Alloc',
      A: stats.autoRate,
      fullMark: 100
    }, {
      subject: 'Conflict-Free',
      A: stats.openConflicts === 0 ? 100 : Math.max(0, 100 - stats.openConflicts * 10),
      fullMark: 100
    }, {
      subject: 'Gate Util',
      A: (stats.byType['GATE'] || 0) / total * 100,
      fullMark: 100
    }, {
      subject: 'Runway Util',
      A: ((stats.byType['RUNWAY_ARR'] || 0) + (stats.byType['RUNWAY_DEP'] || 0)) / total * 100,
      fullMark: 100
    }];
  }, [stats]);

  // Status pie chart
  const statusPieData = useMemo(() => Object.entries(stats.byStatus).map(([name, value]) => ({
    name,
    value
  })), [stats.byStatus]);
  async function handleRunEngine() {
    setRunning(true);
    setRunResult(null);
    try {
      const result = await EngineAPI.runAutoAllocation();
      setRunResult(result);
      await mutateAllocs();
      await mutateConflicts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Engine failed');
    } finally {
      setRunning(false);
    }
  }
  const KPI = [{
    label: 'Total Allocations',
    value: stats.total,
    icon: <Layers size={18} />,
    color: '#fde047',
    border: '#fde047'
  }, {
    label: 'Active Now',
    value: stats.byStatus['ACTIVE'] || 0,
    icon: <Activity size={18} />,
    color: '#06b6d4',
    border: '#06b6d4'
  }, {
    label: 'Confirmed',
    value: stats.byStatus['CONFIRMED'] || 0,
    icon: <CheckCircle size={18} />,
    color: '#22c55e',
    border: '#22c55e'
  }, {
    label: 'Open Conflicts',
    value: stats.openConflicts,
    icon: <AlertTriangle size={18} />,
    color: stats.openConflicts > 0 ? '#ef4444' : '#22c55e',
    border: stats.openConflicts > 0 ? '#ef4444' : '#22c55e'
  }, {
    label: 'Auto-Allocation Rate',
    value: `${stats.autoRate}%`,
    icon: <Zap size={18} />,
    color: '#f59e0b',
    border: '#f59e0b'
  }, {
    label: 'Critical Conflicts',
    value: stats.critical,
    icon: <AlertTriangle size={18} />,
    color: stats.critical > 0 ? '#ef4444' : '#22c55e',
    border: stats.critical > 0 ? '#ef4444' : '#22c55e'
  }];
  return <AuthLayout title="Dashboard">
      <div className="flex flex-col gap-5">

        {/* Top controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleRunEngine} disabled={running} className="btn-primary flex items-center gap-2">
            {running ? <div className="spinner w-4 h-4" /> : <Play size={15} />}
            {running ? 'Running Engine…' : 'Run Auto-Allocation'}
          </button>

          <button onClick={() => setAutoRefresh(r => !r)} className={clsx('flex items-center gap-2 text-sm px-3 py-2 rounded border transition-colors', autoRefresh ? 'bg-green-900/30 border-green-500/40 text-green-400' : 'btn-secondary')}>
            {autoRefresh ? <><span className="dot-live" /> Live</> : <><RefreshCw size={13} /> Auto-refresh</>}
          </button>

          {/* WebSocket status */}
          <div className={clsx('flex items-center gap-1.5 text-xs px-2 py-1 rounded border', wsStatus === 'connected' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-surface-3 border-surface-4 text-muted')}>
            {wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            WS: {wsStatus}
          </div>

          <button onClick={() => {
          mutateAllocs();
          mutateConflicts();
        }} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={14} className={loadingAllocs || loadingConflicts ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Run result banner */}
        {runResult && <div className="flex items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle size={16} />
            Auto-allocation engine completed: <strong>{runResult.allocated} allocations</strong> created
            <button className="ml-auto text-green-600 hover:text-green-400" onClick={() => setRunResult(null)}>✕</button>
          </div>}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {KPI.map(k => <div key={k.label} className="stat-card" style={{
          borderTopColor: k.border
        }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted text-xs">{k.label}</span>
                <span style={{
              color: k.color
            }}>{k.icon}</span>
              </div>
              <div className="font-display text-2xl font-bold" style={{
            color: k.color
          }}>{k.value}</div>
            </div>)}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hourly activity area chart */}
          <div className="card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4 text-secondary">Allocation Activity by Hour (UTC)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hourlyData} margin={{
              top: 0,
              right: 0,
              left: -20,
              bottom: 0
            }}>
                <defs>
                  <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fde047" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#fde047" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{
                fill: '#4a5468',
                fontSize: 10
              }} interval={3} />
                <YAxis tick={{
                fill: '#4a5468',
                fontSize: 10
              }} />
                <Tooltip contentStyle={{
                background: '#181c2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#e8ecf4'
              }} />
                <Area type="monotone" dataKey="count" stroke="#fde047" fill="url(#areaBlue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-2 text-secondary">Operations Scorecard</h3>
            <ResponsiveContainer width="100%" height={170}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{
                fill: '#8892aa',
                fontSize: 9
              }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{
                fill: '#4a5468',
                fontSize: 8
              }} />
                <Radar name="Score" dataKey="A" stroke="#fde047" fill="#fde047" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Resource type bar chart */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-4 text-secondary">By Resource Type</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={typeData} margin={{
              top: 0,
              right: 0,
              left: -20,
              bottom: 0
            }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{
                fill: '#4a5468',
                fontSize: 9
              }} />
                <YAxis tick={{
                fill: '#4a5468',
                fontSize: 10
              }} />
                <Tooltip contentStyle={{
                background: '#181c2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#e8ecf4'
              }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-2 text-secondary">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                  {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{
                background: '#181c2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#e8ecf4'
              }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {statusPieData.map((d, i) => <div key={d.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-sm" style={{
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
              }} />
                  <span className="text-muted">{d.name}: {d.value}</span>
                </div>)}
            </div>
          </div>

          {/* Mode utilization bars */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-4 text-secondary">Allocation Mode</h3>
            <div className="space-y-3">
              {Object.entries(stats.byMode).map(([mode, count]) => {
              const pct = stats.total > 0 ? count / stats.total * 100 : 0;
              return <div key={mode}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary font-mono">{mode}</span>
                      <span className="text-muted">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill transition-all duration-500" style={{
                    width: `${pct}%`,
                    backgroundColor: mode === 'AUTO' ? '#22c55e' : mode === 'MANUAL' ? '#fde047' : '#a855f7'
                  }} />
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent allocations */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Allocations</h3>
              <span className="text-xs text-muted">{allocs.length} total</span>
            </div>
            <div className="overflow-y-auto max-h-64">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Flight</th>
                    <th>Window</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocs.slice(0, 12).map(a => <tr key={a.allocation_id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <ResourceBadge type={a.resource_type} />
                          <span className="font-mono">{a.resource_id}</span>
                        </div>
                      </td>
                      <td className="font-mono">{a.flight_number || a.flight_id.slice(0, 8)}</td>
                      <td className="font-mono text-muted">
                        {(() => {
                      try {
                        return `${format(parseISO(a.start_time), 'HH:mm')}→${format(parseISO(a.end_time), 'HH:mm')}`;
                      } catch {
                        return '—';
                      }
                    })()}
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active conflicts + WS feed */}
          <div className="flex flex-col gap-4">
            <div className="card overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-surface-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Active Conflicts</h3>
                {conflicts.filter(c => c.status === 'open').length > 0 && <span className="text-xs text-red-400 flex items-center gap-1">
                    <span className="dot-live" style={{
                  '--dot-color': '#ef4444'
                }} />
                    {conflicts.filter(c => c.status === 'open').length} open
                  </span>}
              </div>
              <div className="overflow-y-auto max-h-36">
                {conflicts.filter(c => c.status === 'open').length === 0 ? <div className="flex items-center justify-center h-16 text-green-400 text-xs gap-1.5">
                    <CheckCircle size={14} /> All clear — no open conflicts
                  </div> : <table className="data-table text-xs">
                    <thead><tr><th>Severity</th><th>Type</th><th>Description</th><th>Detected</th></tr></thead>
                    <tbody>
                      {conflicts.filter(c => c.status === 'open').slice(0, 8).map(c => <tr key={c.conflict_id}>
                          <td><SeverityBadge severity={c.severity} /></td>
                          <td className="font-mono text-muted">{c.conflict_type}</td>
                          <td className="text-muted truncate max-w-xs">{c.conflict_description}</td>
                          <td className="font-mono text-muted">
                            {(() => {
                        try {
                          return format(parseISO(c.detected_at), 'HH:mm');
                        } catch {
                          return '—';
                        }
                      })()}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>}
              </div>
            </div>

            {/* Live WS event feed */}
            <div className="card p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-secondary">Live Event Feed</span>
                {wsStatus === 'connected' && <span className="dot-live" />}
              </div>
              {wsEvents.length === 0 ? <p className="text-xs text-muted">
                  {wsStatus === 'connected' ? 'Waiting for events…' : 'Enable auto-refresh to connect to live feed'}
                </p> : <div className="space-y-1">
                  {wsEvents.map((e, i) => <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-accent-blue">{format(parseISO(e.ts), 'HH:mm:ss')}</span>
                      <span className="text-muted truncate">{e.desc}</span>
                    </div>)}
                </div>}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>;
}
