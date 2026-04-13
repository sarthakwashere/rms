'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AuthLayout from '@/components/rms/AuthLayout';
import Modal from '@/components/ui/Modal';
import { swrFetcher, ConstraintsAPI, SWR } from '@/lib/api/client';
import { Plus, Edit2, Trash2, Lock, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
const CONSTRAINT_TYPES = ['aircraft_size', 'terminal_match', 'availability', 'capacity', 'custom'];
const DEFAULT_CONSTRAINT = {
  constraint_name: '',
  resource_type: 'GATE',
  constraint_type: 'availability',
  constraint_definition: {},
  is_hard_constraint: true,
  penalty_score: 100,
  is_active: true
};
const TYPE_DESCRIPTIONS = {
  aircraft_size: 'Limits which aircraft types can use this resource based on size/wingspan',
  terminal_match: 'Enforces that flights must use resources in their assigned terminal',
  availability: 'Blocks resource usage during specified maintenance or closure windows',
  capacity: 'Limits the number of simultaneous allocations on a resource',
  custom: 'Custom constraint with user-defined parameters and scoring logic'
};
export default function ConstraintsPage() {
  const {
    data: constraints = [],
    mutate,
    isLoading
  } = useSWR(SWR.constraints, swrFetcher);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_CONSTRAINT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [defJson, setDefJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');
  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_CONSTRAINT);
    setDefJson('{}');
    setJsonError('');
    setError('');
    setShowModal(true);
  }
  function openEdit(c) {
    setEditing(c);
    setForm({
      constraint_name: c.constraint_name,
      resource_type: c.resource_type,
      constraint_type: c.constraint_type,
      constraint_definition: c.constraint_definition,
      is_hard_constraint: c.is_hard_constraint,
      penalty_score: c.penalty_score ?? 100,
      is_active: c.is_active
    });
    setDefJson(JSON.stringify(c.constraint_definition, null, 2));
    setJsonError('');
    setError('');
    setShowModal(true);
  }
  function handleJsonChange(val) {
    setDefJson(val);
    try {
      JSON.parse(val);
      setJsonError('');
    } catch {
      setJsonError('Invalid JSON');
    }
  }
  async function handleSave() {
    if (!form.constraint_name.trim()) {
      setError('Constraint name is required');
      return;
    }
    if (jsonError) {
      setError('Fix JSON errors first');
      return;
    }
    let def = {};
    try {
      def = JSON.parse(defJson);
    } catch {
      setError('Invalid JSON definition');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        constraint_definition: def
      };
      if (editing) {
        await ConstraintsAPI.update(editing.constraint_id, payload);
      } else {
        await ConstraintsAPI.create(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(c) {
    if (!confirm(`Delete constraint "${c.constraint_name}"?`)) return;
    try {
      await ConstraintsAPI.delete(c.constraint_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }
  const hardCount = constraints.filter(c => c.is_hard_constraint).length;
  const softCount = constraints.filter(c => !c.is_hard_constraint).length;
  return <AuthLayout title="Allocation Constraints">
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Resource Constraints</h2>
            <p className="text-muted text-sm mt-0.5">Define hard rules and soft penalties for the allocation engine</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <Plus size={15} /> New Constraint
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Total Constraints</p>
            <p className="text-2xl font-bold font-display">{constraints.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Hard Constraints</p>
            <p className="text-2xl font-bold font-display text-red-400">{hardCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Soft Constraints</p>
            <p className="text-2xl font-bold font-display text-amber-400">{softCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Active</p>
            <p className="text-2xl font-bold font-display text-green-400">{constraints.filter(c => c.is_active).length}</p>
          </div>
        </div>

        {/* Hard vs soft info banner */}
        <div className="card p-3 flex items-start gap-3 bg-surface-2">
          <Info size={16} className="text-accent-blue flex-shrink-0 mt-0.5" />
          <div className="text-sm text-secondary">
            <span className="text-red-400 font-semibold">Hard constraints</span> are absolute — violations block allocation entirely.{' '}
            <span className="text-amber-400 font-semibold">Soft constraints</span> apply a penalty score to discourage but not prevent allocation.
          </div>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? <div className="flex items-center justify-center h-32"><div className="spinner" /></div> : constraints.length === 0 ? <div className="flex flex-col items-center justify-center h-40 text-muted">
              <Lock size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No constraints defined yet</p>
              <button className="btn-primary text-xs px-3 py-1.5 mt-3" onClick={openCreate}>Add First Constraint</button>
            </div> : <table className="data-table">
              <thead>
                <tr>
                  <th>Constraint Name</th>
                  <th>Type</th>
                  <th>Resource</th>
                  <th>Mode</th>
                  <th>Penalty</th>
                  <th>Definition</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {constraints.map(c => <tr key={c.constraint_id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {c.is_hard_constraint ? <Lock size={13} className="text-red-400 flex-shrink-0" /> : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
                        <div>
                          <p className="font-medium">{c.constraint_name}</p>
                          <p className="text-xs text-muted">{c.constraint_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-mono bg-surface-3 px-2 py-0.5 rounded text-secondary">
                        {c.constraint_type}
                      </span>
                    </td>
                    <td>
                      {c.resource_type ? <span className="badge badge-gate text-xs">{c.resource_type}</span> : <span className="text-muted text-xs">All resources</span>}
                    </td>
                    <td>
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded', c.is_hard_constraint ? 'bg-red-900/30 text-red-300' : 'bg-amber-900/30 text-amber-300')}>
                        {c.is_hard_constraint ? 'HARD' : 'SOFT'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">
                        {c.is_hard_constraint ? '∞' : c.penalty_score ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-muted truncate max-w-xs block">
                        {JSON.stringify(c.constraint_definition).slice(0, 50)}…
                      </span>
                    </td>
                    <td>
                      <span className={clsx('text-xs font-semibold', c.is_active ? 'text-green-400' : 'text-muted')}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                        <button className="btn-ghost p-1.5 text-red-400 hover:text-red-300" onClick={() => handleDelete(c)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Constraint' : 'New Constraint'} subtitle="Define an allocation constraint for the engine" size="lg" footer={<div className="flex items-center gap-3 justify-end">
            {error && <p className="text-red-400 text-sm flex-1">{error}</p>}
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Constraint Name *</label>
            <input className="field-input" placeholder="e.g. No Gate Double-Booking" value={form.constraint_name} onChange={e => setForm(f => ({
            ...f,
            constraint_name: e.target.value
          }))} />
          </div>

          <div>
            <label className="field-label">Constraint Type</label>
            <select className="field-select" value={form.constraint_type} onChange={e => setForm(f => ({
            ...f,
            constraint_type: e.target.value
          }))}>
              {CONSTRAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="text-xs text-muted mt-1">{TYPE_DESCRIPTIONS[form.constraint_type]}</p>
          </div>

          <div>
            <label className="field-label">Resource Type</label>
            <select className="field-select" value={form.resource_type || ''} onChange={e => setForm(f => ({
            ...f,
            resource_type: e.target.value
          }))}>
              <option value="">All Resources</option>
              {['GATE', 'STAND', 'BELT', 'RUNWAY_ARR', 'RUNWAY_DEP', 'CHECKIN_DESK'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Mode</label>
            <select className="field-select" value={form.is_hard_constraint ? 'hard' : 'soft'} onChange={e => setForm(f => ({
            ...f,
            is_hard_constraint: e.target.value === 'hard'
          }))}>
              <option value="hard">Hard — Blocks allocation entirely</option>
              <option value="soft">Soft — Apply penalty score</option>
            </select>
          </div>

          {!form.is_hard_constraint && <div>
              <label className="field-label">Penalty Score</label>
              <input className="field-input" type="number" min={0} max={1000} value={form.penalty_score ?? 0} onChange={e => setForm(f => ({
            ...f,
            penalty_score: parseFloat(e.target.value) || 0
          }))} />
            </div>}

          <div>
            <label className="field-label">Status</label>
            <select className="field-select" value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm(f => ({
            ...f,
            is_active: e.target.value === 'active'
          }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label flex items-center justify-between mb-1">
            Constraint Definition (JSON)
            {jsonError && <span className="text-red-400 text-xs">{jsonError}</span>}
          </label>
          <textarea className={clsx('field-input font-mono text-sm', 'min-h-[120px]', jsonError && 'border-red-500')} value={defJson} onChange={e => handleJsonChange(e.target.value)} placeholder='{"max_wingspan_m": 60, "allowed_types": ["A320", "B737"]}' rows={6} />
        </div>
      </Modal>
    </AuthLayout>;
}
