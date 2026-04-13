'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { format, parseISO, addHours, subHours } from 'date-fns';
import AuthLayout from '@/components/rms/AuthLayout';
import { ResourceBadge, StatusBadge } from '@/components/ui/Badge';
import { swrFetcher, AllocationAPI, SWR } from '@/lib/api/client';
import { ChevronLeft, ChevronRight, RotateCcw, RefreshCw, X, Layers, ScanSearch } from 'lucide-react';
import { clsx } from 'clsx';
const ZOOM_CONFIGS = {
  '4h': {
    hours: 4,
    tickMinutes: 30,
    label: '4H'
  },
  '8h': {
    hours: 8,
    tickMinutes: 60,
    label: '8H'
  },
  '12h': {
    hours: 12,
    tickMinutes: 60,
    label: '12H'
  },
  '24h': {
    hours: 24,
    tickMinutes: 120,
    label: '24H'
  }
};
const STATUS_COLORS = {
  PLANNED: '#ca8a04',
  CONFIRMED: '#22c55e',
  ACTIVE: '#22d3ee',
  RELEASED: '#4a5468',
  CANCELLED: '#ef4444'
};
const RESOURCE_TYPES = ['GATE', 'STAND', 'BELT', 'RUNWAY_ARR', 'RUNWAY_DEP'];

function allocationIdOf(a) {
  return String(a.allocation_id ?? a.allocationId ?? '').trim();
}

/**
 * Native HTML5 DnD — works reliably in embedded browsers (e.g. IDE preview) where
 * pointer-based libraries often fail. @dnd-kit is not used on this page.
 */
function AllocBlock({
  allocation,
  rowKey,
  startPct,
  widthPct,
  isSelected,
  isDragging,
  onClick,
  onNativeDrag,
  onRowDragOver,
  onRowDrop
}) {
  const id = allocationIdOf(allocation);
  const canDrag = Boolean(id) && allocation.status !== 'RELEASED' && allocation.status !== 'CANCELLED';
  return <div
      draggable={canDrag}
      onDragStart={e => {
        if (!canDrag) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setDragImage(e.currentTarget, 8, 12);
        } catch {
          /* ignore */
        }
        onNativeDrag?.('start', id);
      }}
      onDragEnd={() => onNativeDrag?.('end')}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onRowDragOver?.(rowKey);
      }}
      onDrop={e => onRowDrop?.(e, rowKey)}
      onClick={e => {
        e.stopPropagation();
        onClick(allocation);
      }}
      style={{
      left: `${startPct}%`,
      width: `${Math.max(widthPct, 0.5)}%`,
      backgroundColor: STATUS_COLORS[allocation.status],
      opacity: isDragging ? 0.35 : 1,
      cursor: canDrag ? 'grab' : 'default'
    }} className={clsx('absolute top-1 bottom-1 rounded flex items-center px-1.5 overflow-hidden transition-shadow select-none', canDrag && 'active:cursor-grabbing', isSelected && 'ring-2 ring-white shadow-lg z-20', !isSelected && 'hover:brightness-125 hover:z-10')}>
      <span className="text-[10px] font-mono text-white truncate leading-none pointer-events-none">
        {allocation.flight_number || allocation.flightNumber || (allocation.flight_id || allocation.flightId || '—').toString().slice(0, 8)}
      </span>
    </div>;
}

function TimelineDropTrack({
  rowKey,
  isDropOver,
  onRowDragOver,
  onRowDrop,
  children
}) {
  return <div
      className={clsx('relative h-10 min-h-10 w-full border-b transition-colors', isDropOver ? 'bg-accent-blue/15 border-accent-blue/40' : 'border-surface-3/40')}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onRowDragOver(rowKey);
      }}
      onDrop={e => onRowDrop(e, rowKey)}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) onRowDragOver(null);
      }}
    >
      {children}
    </div>;
}

// =============================================================================
export default function GanttPage() {
  const [zoom, setZoom] = useState('8h');
  const [windowStart, setWindowStart] = useState(() => subHours(new Date(), 1));
  const [selectedTypes, setSelectedTypes] = useState(new Set(RESOURCE_TYPES));
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverRowKey, setDragOverRowKey] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [msg, setMsg] = useState(null);
  const zoomCfg = ZOOM_CONFIGS[zoom];
  const windowEnd = addHours(windowStart, zoomCfg.hours);
  const totalMs = windowEnd.getTime() - windowStart.getTime();
  const {
    data: allocs = [],
    mutate,
    isLoading
  } = useSWR(SWR.allocations, swrFetcher, {
    refreshInterval: 30000
  });

  // Master data so every gate/stand/etc. appears as a row even with zero allocations
  // (otherwise there is no droppable target — e.g. cannot drag A1 → A2 if A2 has no block).
  const { data: gates = [] } = useSWR(selectedTypes.has('GATE') ? SWR.gates : null, swrFetcher);
  const { data: stands = [] } = useSWR(selectedTypes.has('STAND') ? SWR.stands : null, swrFetcher);
  const { data: belts = [] } = useSWR(selectedTypes.has('BELT') ? SWR.belts : null, swrFetcher);
  const runwaysKey =
    selectedTypes.has('RUNWAY_ARR') || selectedTypes.has('RUNWAY_DEP') ? SWR.runways : null;
  const { data: runways = [] } = useSWR(runwaysKey, swrFetcher);
  function pct(t) {
    return Math.max(0, Math.min(100, (t.getTime() - windowStart.getTime()) / totalMs * 100));
  }
  const nowPct = pct(new Date());

  // Group by resource key: seed from master data, then attach allocations in the time window
  const rows = useMemo(() => {
    const map = new Map();

    const ensureRow = (resourceType, resourceId) => {
      const key = `${resourceType}::${resourceId}`;
      if (!map.has(key)) map.set(key, []);
    };

    if (selectedTypes.has('GATE')) {
      gates.forEach(g => {
        const id = g.gate_code ?? g.gateCode ?? g.gate_id ?? g.gateId;
        if (id) ensureRow('GATE', id);
      });
    }
    if (selectedTypes.has('STAND')) {
      stands.forEach(s => {
        const id = s.stand_code ?? s.standCode ?? s.stand_id ?? s.standId;
        if (id) ensureRow('STAND', id);
      });
    }
    if (selectedTypes.has('BELT')) {
      belts.forEach(b => {
        const id = b.belt_code ?? b.beltCode ?? b.belt_id ?? b.beltId;
        if (id) ensureRow('BELT', id);
      });
    }
    if (selectedTypes.has('RUNWAY_ARR')) {
      runways.forEach(r => {
        const id = r.runway_code ?? r.runwayCode ?? r.runway_id ?? r.runwayId;
        if (id) ensureRow('RUNWAY_ARR', id);
      });
    }
    if (selectedTypes.has('RUNWAY_DEP')) {
      runways.forEach(r => {
        const id = r.runway_code ?? r.runwayCode ?? r.runway_id ?? r.runwayId;
        if (id) ensureRow('RUNWAY_DEP', id);
      });
    }

    allocs.forEach(a => {
      const rt = a.resource_type ?? a.resourceType;
      const rid = a.resource_id ?? a.resourceId;
      if (!rt || !rid || !selectedTypes.has(rt)) return;
      try {
        const s = parseISO(a.start_time ?? a.startTime);
        const e = parseISO(a.end_time ?? a.endTime);
        if (s >= windowEnd || e <= windowStart) return;
        const key = `${rt}::${rid}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(a);
      } catch {}
    });

    return Array.from(map.entries()).map(([key, allocations]) => {
      const sep = key.indexOf('::');
      const resourceType = key.slice(0, sep);
      const resourceId = key.slice(sep + 2);
      return {
        key,
        resourceType,
        resourceId,
        allocations
      };
    }).sort((a, b) => {
      const ai = RESOURCE_TYPES.indexOf(a.resourceType);
      const bi = RESOURCE_TYPES.indexOf(b.resourceType);
      return ai !== bi ? ai - bi : a.resourceId.localeCompare(b.resourceId);
    });
  }, [
    allocs,
    selectedTypes,
    windowStart,
    windowEnd,
    gates,
    stands,
    belts,
    runways
  ]);

  const visibleAllocCount = useMemo(() => rows.reduce((n, r) => n + r.allocations.length, 0), [rows]);

  const typedAllocCount = useMemo(
    () =>
      allocs.filter(a => {
        const rt = a.resource_type ?? a.resourceType;
        return rt && selectedTypes.has(rt);
      }).length,
    [allocs, selectedTypes]
  );

  const fitWindowToAllocations = useCallback(() => {
    let minT = null;
    let maxT = null;
    for (const a of allocs) {
      const rt = a.resource_type ?? a.resourceType;
      if (!rt || !selectedTypes.has(rt)) continue;
      try {
        const s = parseISO(a.start_time ?? a.startTime);
        const e = parseISO(a.end_time ?? a.endTime);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) continue;
        if (!minT || s < minT) minT = s;
        if (!maxT || e > maxT) maxT = e;
      } catch {
        /* skip */
      }
    }
    if (!minT || !maxT) {
      setMsg({
        text: 'No allocations to fit (check type filters)',
        ok: false
      });
      setTimeout(() => setMsg(null), 3500);
      return;
    }
    const padH = 0.75;
    const spanH = Math.max(1, (maxT.getTime() - minT.getTime()) / 3600000 + 2 * padH);
    const order = ['4h', '8h', '12h', '24h'];
    const pick = order.find(z => ZOOM_CONFIGS[z].hours >= spanH) || '24h';
    setZoom(pick);
    setWindowStart(subHours(minT, padH));
    setMsg({
      text: 'View adjusted to your schedule',
      ok: true
    });
    setTimeout(() => setMsg(null), 2500);
  }, [allocs, selectedTypes]);

  const didAutoFitRef = useRef(false);
  useEffect(() => {
    if (isLoading || allocs.length === 0 || didAutoFitRef.current) return;
    const we = addHours(windowStart, ZOOM_CONFIGS[zoom].hours);
    let inView = 0;
    for (const a of allocs) {
      const rt = a.resource_type ?? a.resourceType;
      if (!rt || !selectedTypes.has(rt)) continue;
      try {
        const s = parseISO(a.start_time ?? a.startTime);
        const e = parseISO(a.end_time ?? a.endTime);
        if (!(s >= we || e <= windowStart)) inView++;
      } catch {
        /* skip */
      }
    }
    didAutoFitRef.current = true;
    if (inView === 0) fitWindowToAllocations();
  }, [isLoading, allocs, windowStart, zoom, selectedTypes, fitWindowToAllocations]);

  const ticks = useMemo(() => {
    const result = [];
    let t = new Date(windowStart);
    const step = zoomCfg.tickMinutes * 60 * 1000;
    while (t <= windowEnd) {
      result.push(new Date(t));
      t = new Date(t.getTime() + step);
    }
    return result;
  }, [windowStart, windowEnd, zoomCfg.tickMinutes]);

  const handleDropOnRow = useCallback(
    async (e, targetRowKey) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverRowKey(null);
      setDraggingId(null);
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const alloc = allocs.find(a => allocationIdOf(a) === id);
      if (!alloc) return;
      const rk = targetRowKey;
      const sep = rk.indexOf('::');
      const targetType = sep >= 0 ? rk.slice(0, sep) : '';
      const newResourceId = sep >= 0 ? rk.slice(sep + 2) : rk;
      if (!newResourceId) return;
      const allocRt = alloc.resource_type ?? alloc.resourceType;
      if (targetType && targetType !== allocRt) {
        setMsg({
          text: '✗ Move within the same resource type only',
          ok: false
        });
        setTimeout(() => setMsg(null), 4000);
        return;
      }
      const curRes = alloc.resource_id ?? alloc.resourceId;
      if (newResourceId === curRes) return;
      try {
        setMsg({
          text: 'Reallocating…',
          ok: true
        });
        await AllocationAPI.reallocate(allocationIdOf(alloc), newResourceId, 'Manual reallocation via Gantt');
        await mutate();
        setMsg({
          text: `✓ Reallocated to ${newResourceId}`,
          ok: true
        });
        setTimeout(() => setMsg(null), 3000);
      } catch (err) {
        setMsg({
          text: `✗ ${err instanceof Error ? err.message : 'Failed'}`,
          ok: false
        });
        setTimeout(() => setMsg(null), 5000);
      }
    },
    [allocs, mutate]
  );
  async function handleRelease(a) {
    const rid = a.resource_id ?? a.resourceId;
    if (!confirm(`Release allocation for ${rid}?`)) return;
    setReleasing(true);
    try {
      await AllocationAPI.release(allocationIdOf(a));
      await mutate();
      setSelectedAlloc(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Release failed');
    } finally {
      setReleasing(false);
    }
  }
  return <AuthLayout title="Gantt Timeline">
      <div className="flex flex-col h-full gap-4" style={{
      minHeight: 0
    }}>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button className="btn-ghost p-2" onClick={() => setWindowStart(s => addHours(s, -zoomCfg.hours / 2))}>
              <ChevronLeft size={15} />
            </button>
            <span className="font-mono text-xs text-secondary px-1">
              {format(windowStart, 'MMM dd HH:mm')} — {format(windowEnd, 'HH:mm')}
            </span>
            <button className="btn-ghost p-2" onClick={() => setWindowStart(s => addHours(s, zoomCfg.hours / 2))}>
              <ChevronRight size={15} />
            </button>
            <button className="btn-secondary text-xs px-2 py-1 ml-1" onClick={() => setWindowStart(subHours(new Date(), 1))}>
              <RotateCcw size={11} className="inline mr-1" />Now
            </button>
            <button
              type="button"
              className="btn-secondary text-xs px-2 py-1 ml-1"
              title="Pan and zoom so your allocations appear in the chart"
              onClick={fitWindowToAllocations}
            >
              <ScanSearch size={11} className="inline mr-1" />
              Fit
            </button>
          </div>

          <div className="h-5 w-px bg-surface-4" />

          <div className="flex gap-1">
            {Object.keys(ZOOM_CONFIGS).map(z => <button key={z} onClick={() => setZoom(z)} className={clsx('px-2 py-1 text-xs rounded font-mono', zoom === z ? 'bg-accent-blue text-white' : 'btn-ghost')}>
                {ZOOM_CONFIGS[z].label}
              </button>)}
          </div>

          <div className="h-5 w-px bg-surface-4" />

          <div className="flex gap-1 flex-wrap">
            {RESOURCE_TYPES.map(t => <button key={t} onClick={() => setSelectedTypes(prev => {
            const n = new Set(prev);
            n.has(t) ? n.delete(t) : n.add(t);
            return n;
          })} className={clsx('text-xs px-2 py-0.5 rounded border transition-colors', selectedTypes.has(t) ? 'border-accent-blue/50 bg-surface-3 text-primary' : 'border-surface-4 text-muted')}>
                {t.replace('_', ' ')}
              </button>)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {msg && <span className={clsx('text-xs font-mono px-2 py-0.5 rounded', msg.ok ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20')}>
                {msg.text}
              </span>}
            <button className="btn-ghost p-1.5" onClick={() => mutate()}>
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {typedAllocCount > 0 && visibleAllocCount === 0 && !isLoading && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/95"
            role="status"
          >
            <span>
              <strong>{typedAllocCount}</strong> allocation{typedAllocCount === 1 ? '' : 's'} for the selected types are{' '}
              <strong>outside</strong> the current time window — bars stay hidden until you pan/zoom or fit.
            </span>
            <button type="button" className="btn-primary text-xs px-3 py-1.5 shrink-0" onClick={fitWindowToAllocations}>
              Fit to schedule
            </button>
          </div>
        )}

        {/* Gantt Grid — native HTML5 drag/drop for broad browser / preview compatibility */}
        <div className="card flex flex-col overflow-hidden" style={{
          flex: 1,
          minHeight: 0
        }}>
            {/* Header */}
            <div className="flex border-b border-surface-3 bg-surface-2 flex-shrink-0">
              <div className="w-44 flex-shrink-0 px-3 py-2 text-xs text-muted uppercase tracking-wider border-r border-surface-3">Resource</div>
              <div className="flex-1 relative h-9">
                {ticks.map((tick, i) => <div key={i} className="absolute top-0 h-full flex flex-col justify-center pointer-events-none" style={{
                left: `${pct(tick)}%`
              }}>
                    <div className="w-px h-2 bg-surface-4" />
                    <span className="text-[10px] font-mono text-muted pl-1">{format(tick, 'HH:mm')}</span>
                  </div>)}
                <div className="absolute top-0 w-0.5 h-full bg-red-500/70 z-10 pointer-events-none" style={{
                left: `${nowPct}%`
              }} />
              </div>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && rows.length === 0 ? <div className="flex items-center justify-center h-32"><div className="spinner" /></div> : rows.length === 0 ? <div className="flex flex-col items-center justify-center h-32 text-muted">
                  <Layers size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No allocations in this window</p>
                </div> : rows.map(row => <div key={row.key} className="flex border-b border-surface-3/50 hover:bg-surface-2/30 group">
                  <div className="w-44 flex-shrink-0 px-2 flex items-center gap-1.5 border-r border-surface-3/50">
                    <ResourceBadge type={row.resourceType} />
                    <span className="font-mono text-xs text-secondary truncate">{row.resourceId}</span>
                  </div>
                  <div className="flex-1">
                    <TimelineDropTrack
                      rowKey={row.key}
                      isDropOver={dragOverRowKey === row.key}
                      onRowDragOver={key => setDragOverRowKey(key)}
                      onRowDrop={handleDropOnRow}
                    >
                      {/* Now line */}
                      <div className="absolute top-0 w-0.5 h-full bg-red-500/30 z-10 pointer-events-none" style={{
                    left: `${nowPct}%`
                  }} />
                      {row.allocations.map(a => {
                    try {
                      const s = parseISO(a.start_time ?? a.startTime);
                      const e = parseISO(a.end_time ?? a.endTime);
                      const sp = pct(s);
                      const ep = pct(e);
                      const wp = ep - sp;
                      if (wp <= 0) return null;
                      return <AllocBlock key={allocationIdOf(a)} allocation={a} rowKey={row.key} startPct={sp} widthPct={wp} isSelected={allocationIdOf(selectedAlloc) === allocationIdOf(a)} isDragging={draggingId === allocationIdOf(a)} onClick={setSelectedAlloc} onRowDragOver={key => setDragOverRowKey(key)} onRowDrop={handleDropOnRow} onNativeDrag={(phase, dragId) => {
                        if (phase === 'start') setDraggingId(dragId);
                        if (phase === 'end') {
                          setDraggingId(null);
                          setDragOverRowKey(null);
                        }
                      }} />;
                    } catch {
                      return null;
                    }
                  })}
                    </TimelineDropTrack>
                  </div>
                </div>)}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-surface-3 bg-surface-2 text-xs text-muted flex-shrink-0">
              <span>
                {rows.length} resources · {visibleAllocCount} in view / {allocs.length} total allocations
              </span>
              <div className="ml-auto flex items-center gap-3">
                {Object.entries(STATUS_COLORS).map(([s, c]) => <div key={s} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{
                  backgroundColor: c
                }} />
                    <span>{s}</span>
                  </div>)}
              </div>
            </div>
          </div>

        {/* Detail panel */}
        {selectedAlloc && <div className="card-raised p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-0.5">Flight</p>
                  <p className="font-mono">
                    {selectedAlloc.flight_number || selectedAlloc.flightNumber || (selectedAlloc.flight_id || selectedAlloc.flightId || '').toString().slice(0, 12)}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Resource</p>
                  <p className="font-mono">{selectedAlloc.resource_id ?? selectedAlloc.resourceId}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Window</p>
                  <p className="font-mono text-xs">
                    {format(parseISO(selectedAlloc.start_time ?? selectedAlloc.startTime), 'MMM dd HH:mm')} →{' '}
                    {format(parseISO(selectedAlloc.end_time ?? selectedAlloc.endTime), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Status / Mode</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedAlloc.status} />
                    <span className="badge badge-gate text-xs">{selectedAlloc.allocation_mode ?? selectedAlloc.allocationMode}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {(selectedAlloc.status === 'PLANNED' || selectedAlloc.status === 'CONFIRMED') && <button className="btn-danger text-xs px-3 py-1.5" disabled={releasing} onClick={() => handleRelease(selectedAlloc)}>
                    {releasing ? 'Releasing…' : 'Release'}
                  </button>}
                <button className="btn-ghost p-1.5" onClick={() => setSelectedAlloc(null)}><X size={14} /></button>
              </div>
            </div>
          </div>}

        <p className="text-xs text-muted text-center">
          Drag a coloured block onto another resource row to reallocate (click row track to drop) · Click a block for details
        </p>
      </div>
    </AuthLayout>;
}
