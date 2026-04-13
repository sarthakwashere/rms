'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { format, differenceInMinutes, addMinutes } from 'date-fns';
import { useRMSStore } from '@/lib/store/rms';
import { TimelineAPI, AllocationAPI } from '@/lib/api';
import { Badge, StatusDot, UtilBar } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
const RESOURCE_COL_W = 180;
const ROW_H = 52;
const AIRLINE_COLORS = {
  EK: '#06b6d4',
  EY: '#f59e0b',
  FZ: '#8b5cf6',
  QR: '#10b981',
  GF: '#f43f5e',
  WY: '#38bdf8',
  SV: '#fb923c'
};
function getAllocColor(airline, hasConflict) {
  if (hasConflict) return 'rgba(244,63,94,0.8)';
  if (airline && AIRLINE_COLORS[airline]) return AIRLINE_COLORS[airline];
  return 'rgba(6,182,212,0.6)';
}
export default function GanttChart() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAlloc, setActiveAlloc] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const containerRef = useRef(null);
  const {
    timelineView,
    filters,
    selectAllocation
  } = useRMSStore();
  const {
    startTime,
    endTime,
    zoomLevel
  } = timelineView;
  const totalMinutes = differenceInMinutes(endTime, startTime);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  }));
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TimelineAPI.gantt({
        time_from: startTime.toISOString(),
        time_to: endTime.toISOString(),
        resource_types: timelineView.resourceTypes,
        terminal_filter: filters.terminal,
        airline_filter: filters.airlines.length ? filters.airlines : undefined,
        show_conflicts_only: filters.showConflictsOnly
      });
      setResources(data.resources);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, timelineView.resourceTypes, filters]);
  useEffect(() => {
    load();
  }, [load]);
  function positionBlock(block) {
    const blockStart = new Date(block.scheduled_start);
    const blockEnd = new Date(block.scheduled_end);
    const startOffset = Math.max(0, differenceInMinutes(blockStart, startTime));
    const duration = differenceInMinutes(blockEnd, blockStart);
    const leftPct = startOffset / totalMinutes * 100;
    const widthPct = duration / totalMinutes * 100;
    return {
      left: `${leftPct}%`,
      width: `${Math.max(0.5, widthPct)}%`
    };
  }
  function handleDragStart(e) {
    const alloc = e.active.data.current?.alloc;
    if (alloc) setActiveAlloc(alloc);
  }
  async function handleDragEnd(e) {
    setActiveAlloc(null);
    const {
      active,
      over
    } = e;
    if (!over) return;
    const newResourceId = over.data.current?.resourceId;
    if (!newResourceId) return;
    try {
      await AllocationAPI.reallocate(active.id, newResourceId, 'Manual reallocation via Gantt');
      await load();
    } catch (err) {
      alert(`Reallocation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Generate time markers
  const markers = [];
  const markerInterval = zoomLevel === 'hour' ? 15 : zoomLevel === '6hour' ? 30 : zoomLevel === 'day' ? 60 : 240;
  let t = new Date(startTime);
  while (t <= endTime) {
    const pct = differenceInMinutes(t, startTime) / totalMinutes * 100;
    markers.push({
      label: format(t, markerInterval < 60 ? 'HH:mm' : 'HH:mm'),
      pct
    });
    t = addMinutes(t, markerInterval);
  }
  return <div>
      {/* Toolbar */}
      <GanttToolbar onRefresh={load} loading={loading} />

      {error && <div className="alert alert-error" style={{
      marginBottom: 12
    }}>⚠ {error} <button className="btn btn-ghost btn-sm" style={{
        marginLeft: 8
      }} onClick={load}>Retry</button></div>}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="card" style={{
        overflow: 'hidden'
      }}>
          {/* Time header */}
          <div className="gantt-header" style={{
          display: 'flex'
        }}>
            <div style={{
            width: RESOURCE_COL_W,
            minWidth: RESOURCE_COL_W,
            padding: '6px 12px',
            borderRight: '1px solid var(--border)',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
              Resource
            </div>
            <div style={{
            flex: 1,
            position: 'relative',
            height: 28
          }}>
              {markers.map(m => <div key={m.pct} style={{
              position: 'absolute',
              left: `${m.pct}%`,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 4
            }}>
                  <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                whiteSpace: 'nowrap'
              }}>{m.label}</span>
                  <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: 1,
                height: resources.length * ROW_H,
                background: 'rgba(30,42,66,0.6)',
                zIndex: 1
              }} />
                </div>)}
            </div>
          </div>

          {/* Rows */}
          <div ref={containerRef} className="gantt-container" style={{
          maxHeight: 600
        }}>
            {loading && resources.length === 0 && <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            gap: 10
          }}>
                <Spinner size={20} />
                <span style={{
              color: 'var(--muted)',
              fontSize: 13
            }}>Loading timeline...</span>
              </div>}
            {!loading && resources.length === 0 && <div style={{
            textAlign: 'center',
            padding: 60,
            color: 'var(--muted)',
            fontSize: 13
          }}>No resources found for this time range</div>}
            {resources.map(row => <GanttRow key={row.resource_identifier} row={row} positionBlock={positionBlock} selectedId={selectedId} onSelect={block => {
            setSelectedId(block.allocation_id);
            setDetail(block);
            selectAllocation(block.allocation_id);
          }} />)}
          </div>
        </div>

        <DragOverlay>
          {activeAlloc && <div className="alloc-block" style={{
          background: getAllocColor(activeAlloc.airline_code),
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          opacity: 0.9,
          width: 120
        }}>
              {activeAlloc.flight_number || activeAlloc.allocation_id.slice(0, 6)}
            </div>}
        </DragOverlay>
      </DndContext>

      {/* Detail panel */}
      {detail && <AllocationDetail block={detail} onClose={() => setDetail(null)} />}
    </div>;
}

// ── GanttRow ──────────────────────────────────────────────────────────────────

import { useDraggable, useDroppable } from '@dnd-kit/core';
function GanttRow({
  row,
  positionBlock,
  selectedId,
  onSelect
}) {
  const {
    setNodeRef
  } = useDroppable({
    id: row.resource_identifier,
    data: {
      resourceId: row.resource_identifier
    }
  });
  const utilColor = row.utilization_pct >= 90 ? 'var(--rose)' : row.utilization_pct >= 75 ? 'var(--amber)' : 'var(--emerald)';
  return <div className="gantt-row">
      {/* Resource info */}
      <div className="gantt-resource-cell">
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
          <StatusDot status={row.current_status} />
          <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--bright)'
        }}>{row.resource_identifier}</span>
        </div>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 4
      }}>
          <span style={{
          fontSize: 10,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>{row.resource_type}</span>
          {row.terminal && <span style={{
          fontSize: 10,
          color: 'rgba(139,156,191,0.5)'
        }}>T{row.terminal}</span>}
        </div>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 4
      }}>
          <UtilBar pct={row.utilization_pct} />
          <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: utilColor
        }}>{row.utilization_pct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Timeline */}
      <div ref={setNodeRef} className="gantt-timeline-cell" style={{
      height: ROW_H
    }}>
        {row.allocations.map(block => <DraggableBlock key={block.allocation_id} block={block} pos={positionBlock(block)} selected={selectedId === block.allocation_id} onSelect={onSelect} />)}
      </div>
    </div>;
}
function DraggableBlock({
  block,
  pos,
  selected,
  onSelect
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useDraggable({
    id: block.allocation_id,
    data: {
      alloc: block
    }
  });
  const hasConflict = block.conflicts.length > 0;
  const color = getAllocColor(block.airline_code, hasConflict);
  return <div ref={setNodeRef} {...attributes} {...listeners} className={`alloc-block ${hasConflict ? 'conflict' : ''}`} onClick={() => onSelect(block)} style={{
    ...pos,
    background: color,
    color: '#fff',
    opacity: isDragging ? 0.5 : 1,
    outline: selected ? '2px solid #fff' : 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: 11
  }}>
      {block.flight_number || block.airline_code || block.allocation_id.slice(0, 6)}
    </div>;
}

// ── Gantt Toolbar ─────────────────────────────────────────────────────────────

function GanttToolbar({
  onRefresh,
  loading
}) {
  const {
    timelineView,
    setZoomLevel,
    shiftForward,
    shiftBackward,
    resetToNow,
    setFilters,
    filters
  } = useRMSStore();
  const {
    startTime,
    endTime,
    zoomLevel
  } = timelineView;
  return <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap'
  }}>
      {/* Time range */}
      <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '6px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text)'
    }}>
        {format(startTime, 'dd MMM HH:mm')} — {format(endTime, 'dd MMM HH:mm')}
      </div>

      {/* Navigation */}
      <button className="btn btn-ghost btn-sm" onClick={shiftBackward}>‹ Back</button>
      <button className="btn btn-ghost btn-sm" onClick={resetToNow}>Now</button>
      <button className="btn btn-ghost btn-sm" onClick={shiftForward}>Fwd ›</button>

      {/* Zoom */}
      <div style={{
      display: 'flex',
      gap: 2,
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: 2
    }}>
        {['hour', '6hour', 'day', 'week'].map(level => <button key={level} onClick={() => setZoomLevel(level)} style={{
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        background: zoomLevel === level ? 'var(--cyan)' : 'transparent',
        color: zoomLevel === level ? 'var(--bg)' : 'var(--muted)'
      }}>
            {level === '6hour' ? '6H' : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>)}
      </div>

      {/* Conflicts only toggle */}
      <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      fontSize: 12,
      color: 'var(--muted)'
    }}>
        <label className="toggle">
          <input type="checkbox" checked={filters.showConflictsOnly} onChange={e => setFilters({
          showConflictsOnly: e.target.checked
        })} />
          <span className="toggle-slider" />
        </label>
        Conflicts only
      </label>

      <div style={{
      flex: 1
    }} />

      <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading}>
        {loading ? <Spinner size={14} /> : '↻'} Refresh
      </button>
    </div>;
}

// ── Allocation Detail ─────────────────────────────────────────────────────────

function AllocationDetail({
  block,
  onClose
}) {
  return <div style={{
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 320,
    zIndex: 80
  }}>
      <div className="card">
        <div className="card-header">
          <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--bright)',
          letterSpacing: '0.04em'
        }}>
            {block.flight_number || 'Allocation Detail'}
          </div>
          <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: 16
        }}>✕</button>
        </div>
        <div className="card-body" style={{
        fontSize: 12
      }}>
          <Row label="Allocation ID" value={<span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11
        }}>{block.allocation_id}</span>} />
          {block.flight_number && <Row label="Flight" value={<span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600
        }}>{block.flight_number}</span>} />}
          {block.airline_code && <Row label="Airline" value={block.airline_code} />}
          {block.aircraft_type && <Row label="A/C Type" value={block.aircraft_type} />}
          <Row label="Start" value={format(new Date(block.scheduled_start), 'dd MMM HH:mm')} />
          <Row label="End" value={format(new Date(block.scheduled_end), 'dd MMM HH:mm')} />
          <Row label="Duration" value={`${differenceInMinutes(new Date(block.scheduled_end), new Date(block.scheduled_start))} min`} />
          <Row label="Status" value={<Badge value={block.status} />} />
          {block.score !== undefined && <Row label="Score" value={<span style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--emerald)'
        }}>{block.score.toFixed(1)}</span>} />}
          {block.conflicts.length > 0 && <div style={{
          marginTop: 10,
          padding: '8px 10px',
          background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 6
        }}>
              <div style={{
            fontSize: 11,
            color: 'var(--rose)',
            fontWeight: 600,
            marginBottom: 4
          }}>⚠ {block.conflicts.length} conflict(s)</div>
              {block.conflicts.map(c => <div key={c} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'rgba(244,63,94,0.8)'
          }}>{c}</div>)}
            </div>}
        </div>
      </div>
    </div>;
}
function Row({
  label,
  value
}) {
  return <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: '1px solid rgba(30,42,66,0.5)'
  }}>
      <span style={{
      color: 'var(--muted)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }}>{label}</span>
      <span style={{
      color: 'var(--text)',
      fontWeight: 500
    }}>{value}</span>
    </div>;
}
