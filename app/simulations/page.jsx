'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AuthLayout from '@/components/rms/AuthLayout';
import Modal from '@/components/ui/Modal';
import { swrFetcher, SimulationsAPI, SWR } from '@/lib/api/client';
import { Plus, Play, CheckCircle, XCircle, Clock, Loader, Trash2, Info, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
const SCENARIO_TYPES = ['rule_change', 'constraint_test', 'capacity_planning', 'what_if'];
const SCENARIO_DESCRIPTIONS = {
  rule_change: 'Simulate impact of modifying allocation rules without applying changes',
  constraint_test: 'Test how constraint modifications affect resource availability',
  capacity_planning: 'Model scenarios with increased/decreased resource capacity',
  what_if: 'Free-form scenario analysis with custom parameters'
};
const STATUS_CONFIG = {
  created: {
    color: 'text-muted',
    icon: <Clock size={13} />,
    label: 'Ready'
  },
  running: {
    color: 'text-accent-amber',
    icon: <Loader size={13} className="animate-spin" />,
    label: 'Running…'
  },
  completed: {
    color: 'text-green-400',
    icon: <CheckCircle size={13} />,
    label: 'Completed'
  },
  failed: {
    color: 'text-red-400',
    icon: <XCircle size={13} />,
    label: 'Failed'
  }
};
export default function SimulationsPage() {
  const {
    data: sims = [],
    mutate,
    isLoading
  } = useSWR(SWR.simulations, swrFetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [showResults, setShowResults] = useState(null);
  const [running, setRunning] = useState(null);
  const [applying, setApplying] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    simulation_name: '',
    base_date: new Date().toISOString().split('T')[0],
    scenario_type: 'what_if',
    scenario_parameters: '{}'
  });
  const [paramsError, setParamsError] = useState('');
  async function handleCreate() {
    if (!form.simulation_name.trim()) {
      setError('Simulation name is required');
      return;
    }
    let params = {};
    try {
      params = JSON.parse(form.scenario_parameters);
    } catch {
      setError('Invalid JSON parameters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await SimulationsAPI.create({
        simulation_name: form.simulation_name,
        base_date: form.base_date,
        scenario_type: form.scenario_type,
        scenario_parameters: params
      });
      await mutate();
      setShowCreate(false);
      setForm({
        simulation_name: '',
        base_date: new Date().toISOString().split('T')[0],
        scenario_type: 'what_if',
        scenario_parameters: '{}'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }
  async function handleRun(sim) {
    setRunning(sim.simulation_id);
    try {
      await SimulationsAPI.run(sim.simulation_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunning(null);
    }
  }
  async function handleApply(sim) {
    if (!confirm(`Apply simulation "${sim.simulation_name}" to production? This will modify live allocations.`)) return;
    setApplying(sim.simulation_id);
    try {
      await SimulationsAPI.apply(sim.simulation_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(null);
    }
  }
  async function handleDelete(sim) {
    if (!confirm(`Delete simulation "${sim.simulation_name}"?`)) return;
    try {
      await SimulationsAPI.delete(sim.simulation_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }
  const completedCount = sims.filter(s => s.status === 'completed').length;
  const runningCount = sims.filter(s => s.status === 'running').length;
  return <AuthLayout title="Simulations">
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">What-If Simulations</h2>
            <p className="text-muted text-sm mt-0.5">Model allocation scenarios without affecting production data</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Simulation
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4"><p className="text-muted text-xs mb-1">Total</p><p className="text-2xl font-bold font-display">{sims.length}</p></div>
          <div className="card p-4"><p className="text-muted text-xs mb-1">Completed</p><p className="text-2xl font-bold font-display text-green-400">{completedCount}</p></div>
          <div className="card p-4"><p className="text-muted text-xs mb-1">Running</p><p className="text-2xl font-bold font-display text-amber-400">{runningCount}</p></div>
          <div className="card p-4"><p className="text-muted text-xs mb-1">Pending</p><p className="text-2xl font-bold font-display text-secondary">{sims.filter(s => s.status === 'created').length}</p></div>
        </div>

        {/* Simulation cards */}
        <div className="grid gap-3">
          {isLoading ? <div className="flex items-center justify-center h-32 card"><div className="spinner" /></div> : sims.length === 0 ? <div className="card flex flex-col items-center justify-center h-40 text-muted">
              <Zap size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No simulations yet</p>
              <button className="btn-primary text-xs px-3 py-1.5 mt-3" onClick={() => setShowCreate(true)}>Create First Simulation</button>
            </div> : sims.map(sim => {
          const cfg = STATUS_CONFIG[sim.status];
          const isRunning = running === sim.simulation_id;
          const isApplying = applying === sim.simulation_id;
          return <div key={sim.simulation_id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{sim.simulation_name}</h3>
                      <span className={clsx('flex items-center gap-1 text-xs', cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="font-mono bg-surface-3 px-1.5 py-0.5 rounded">{sim.scenario_type}</span>
                      <span>Base: {sim.base_date}</span>
                      <span>Created: {format(parseISO(sim.created_at), 'MMM dd HH:mm')}</span>
                    </div>

                    {/* Results summary */}
                    {sim.status === 'completed' && sim.results && <div className="mt-3 grid grid-cols-4 gap-2">
                        {[{
                    label: 'Allocations Changed',
                    val: sim.results.allocations_changed ?? 0,
                    color: 'text-accent-blue'
                  }, {
                    label: 'New Conflicts',
                    val: sim.results.new_conflicts ?? 0,
                    color: 'text-red-400'
                  }, {
                    label: 'Resolved Conflicts',
                    val: sim.results.resolved_conflicts ?? 0,
                    color: 'text-green-400'
                  }, {
                    label: 'Score Improvement',
                    val: `${sim.results.score_improvement_pct?.toFixed(1) ?? 0}%`,
                    color: 'text-accent-cyan'
                  }].map(({
                    label,
                    val,
                    color
                  }) => <div key={label} className="bg-surface-2 rounded p-2">
                            <p className="text-muted text-xs">{label}</p>
                            <p className={clsx('font-bold font-mono text-lg', color)}>{val}</p>
                          </div>)}
                      </div>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sim.status === 'created' && <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1" disabled={isRunning} onClick={() => handleRun(sim)}>
                        {isRunning ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
                        {isRunning ? 'Running…' : 'Run'}
                      </button>}
                    {sim.status === 'completed' && <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1" disabled={isApplying} onClick={() => handleApply(sim)}>
                        {isApplying ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        {isApplying ? 'Applying…' : 'Apply to Prod'}
                      </button>}
                    <button className="btn-ghost p-1.5 text-red-400" onClick={() => handleDelete(sim)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Simulation" subtitle="Create a what-if scenario to test allocation changes safely" size="lg" footer={<div className="flex items-center gap-3 justify-end">
            {error && <p className="text-red-400 text-sm flex-1">{error}</p>}
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={handleCreate}>
              {saving ? 'Creating…' : 'Create Simulation'}
            </button>
          </div>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Simulation Name *</label>
            <input className="field-input" placeholder="e.g. Peak Hours Rebalance — Summer 2025" value={form.simulation_name} onChange={e => setForm(f => ({
            ...f,
            simulation_name: e.target.value
          }))} />
          </div>

          <div>
            <label className="field-label">Scenario Type</label>
            <select className="field-select" value={form.scenario_type} onChange={e => setForm(f => ({
            ...f,
            scenario_type: e.target.value
          }))}>
              {SCENARIO_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <p className="text-xs text-muted mt-1">{SCENARIO_DESCRIPTIONS[form.scenario_type]}</p>
          </div>

          <div>
            <label className="field-label">Base Date</label>
            <input className="field-input" type="date" value={form.base_date} onChange={e => setForm(f => ({
            ...f,
            base_date: e.target.value
          }))} />
          </div>

          <div className="col-span-2">
            <label className="field-label flex items-center justify-between">
              Scenario Parameters (JSON)
              {paramsError && <span className="text-red-400 text-xs">{paramsError}</span>}
            </label>
            <textarea className={clsx('field-input font-mono text-sm min-h-[100px]', paramsError && 'border-red-500')} placeholder='{"capacity_multiplier": 1.2, "rule_ids_to_disable": ["abc123"]}' value={form.scenario_parameters} rows={5} onChange={e => {
            setForm(f => ({
              ...f,
              scenario_parameters: e.target.value
            }));
            try {
              JSON.parse(e.target.value);
              setParamsError('');
            } catch {
              setParamsError('Invalid JSON');
            }
          }} />
          </div>
        </div>

        <div className="mt-3 p-3 bg-surface-2 rounded-lg flex items-start gap-2 text-sm text-muted">
          <Info size={14} className="text-accent-blue flex-shrink-0 mt-0.5" />
          <span>Simulations run against a snapshot of current data. Results are never applied automatically — you choose when to apply them.</span>
        </div>
      </Modal>
    </AuthLayout>;
}
