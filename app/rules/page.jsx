'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AuthLayout from '@/components/rms/AuthLayout';
import Modal from '@/components/ui/Modal';
import { swrFetcher, RulesAPI, SWR } from '@/lib/api/client';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Shield } from 'lucide-react';
const RESOURCE_TYPE_OPTIONS = ['', 'GATE', 'STAND', 'BELT', 'RUNWAY_ARR', 'RUNWAY_DEP', 'CHECKIN_DESK'];
const DEFAULT_RULE = {
  rule_name: '',
  resource_type: 'GATE',
  priority: 5,
  scoring_criteria: {
    terminal_match: 10,
    airline_affinity: 8,
    size_fit: 6
  },
  applicable_airlines: [],
  applicable_terminals: [],
  time_windows: [],
  is_active: true
};
export default function RulesPage() {
  const {
    data: rules = [],
    mutate,
    isLoading
  } = useSWR(SWR.rules, swrFetcher);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_RULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Scoring criteria editor state
  const [newCriteriaKey, setNewCriteriaKey] = useState('');
  const [newCriteriaVal, setNewCriteriaVal] = useState('');
  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_RULE);
    setError('');
    setShowModal(true);
  }
  function openEdit(rule) {
    setEditing(rule);
    setForm({
      rule_name: rule.rule_name,
      resource_type: rule.resource_type,
      priority: rule.priority,
      scoring_criteria: {
        ...rule.scoring_criteria
      },
      applicable_airlines: rule.applicable_airlines || [],
      applicable_terminals: rule.applicable_terminals || [],
      time_windows: rule.time_windows || [],
      is_active: rule.is_active
    });
    setError('');
    setShowModal(true);
  }
  async function handleSave() {
    if (!form.rule_name.trim()) {
      setError('Rule name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await RulesAPI.update(editing.rule_id, form);
      } else {
        await RulesAPI.create(form);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(rule) {
    if (!confirm(`Delete rule "${rule.rule_name}"? This cannot be undone.`)) return;
    try {
      await RulesAPI.delete(rule.rule_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }
  async function handleToggle(rule) {
    try {
      await RulesAPI.toggle(rule.rule_id, !rule.is_active);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    }
  }
  function addCriteria() {
    if (!newCriteriaKey.trim()) return;
    setForm(f => ({
      ...f,
      scoring_criteria: {
        ...f.scoring_criteria,
        [newCriteriaKey.trim()]: parseFloat(newCriteriaVal) || 0
      }
    }));
    setNewCriteriaKey('');
    setNewCriteriaVal('');
  }
  function removeCriteria(key) {
    setForm(f => {
      const c = {
        ...f.scoring_criteria
      };
      delete c[key];
      return {
        ...f,
        scoring_criteria: c
      };
    });
  }
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  return <AuthLayout title="Allocation Rules">
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Allocation Rules Engine</h2>
            <p className="text-muted text-sm mt-0.5">Define scoring criteria and priority ordering for the auto-allocation engine</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <Plus size={15} /> New Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Total Rules</p>
            <p className="text-2xl font-bold font-display">{rules.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Active Rules</p>
            <p className="text-2xl font-bold font-display text-green-400">{rules.filter(r => r.is_active).length}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs mb-1">Inactive Rules</p>
            <p className="text-2xl font-bold font-display text-amber-400">{rules.filter(r => !r.is_active).length}</p>
          </div>
        </div>

        {/* Rules table */}
        <div className="card overflow-hidden">
          {isLoading ? <div className="flex items-center justify-center h-32"><div className="spinner" /></div> : sorted.length === 0 ? <div className="flex flex-col items-center justify-center h-40 text-muted">
              <Shield size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No rules configured yet</p>
              <button className="btn-primary text-xs px-3 py-1.5 mt-3" onClick={openCreate}>Create First Rule</button>
            </div> : <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Rule Name</th>
                  <th>Resource Type</th>
                  <th>Scoring Criteria</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rule, i) => <tr key={rule.rule_id}>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-accent-blue font-semibold">#{rule.priority}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{rule.rule_name}</p>
                        <p className="text-xs text-muted">{rule.rule_id.slice(0, 8)}…</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gate text-xs">{rule.resource_type}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(rule.scoring_criteria).map(([k, v]) => <span key={k} className="text-xs font-mono bg-surface-3 px-1.5 py-0.5 rounded text-secondary">
                            {k}: <span className="text-accent-blue">{v}</span>
                          </span>)}
                      </div>
                    </td>
                    <td className="text-xs text-muted">
                      {rule.applicable_airlines?.length ? `Airlines: ${rule.applicable_airlines.join(', ')}` : 'All airlines'}
                      {rule.applicable_terminals?.length ? ` · T: ${rule.applicable_terminals.join(', ')}` : ''}
                    </td>
                    <td>
                      <button onClick={() => handleToggle(rule)} className="flex items-center gap-1 text-xs transition-colors hover:opacity-80">
                        {rule.is_active ? <><ToggleRight size={18} className="text-green-400" /><span className="text-green-400">Active</span></> : <><ToggleLeft size={18} className="text-muted" /><span className="text-muted">Inactive</span></>}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(rule)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-ghost p-1.5 text-red-400 hover:text-red-300" onClick={() => handleDelete(rule)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Rule' : 'Create Allocation Rule'} subtitle="Configure scoring criteria for the auto-allocation engine" size="lg" footer={<div className="flex items-center gap-3 justify-end">
            {error && <p className="text-red-400 text-sm flex-1">{error}</p>}
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Rule Name *</label>
            <input className="field-input" placeholder="e.g. Wide-Body Gate Priority" value={form.rule_name} onChange={e => setForm(f => ({
            ...f,
            rule_name: e.target.value
          }))} />
          </div>

          <div>
            <label className="field-label">Resource Type</label>
            <select className="field-select" value={form.resource_type} onChange={e => setForm(f => ({
            ...f,
            resource_type: e.target.value
          }))}>
              {RESOURCE_TYPE_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Priority (1 = highest)</label>
            <input className="field-input" type="number" min={1} max={100} value={form.priority} onChange={e => setForm(f => ({
            ...f,
            priority: parseInt(e.target.value) || 1
          }))} />
          </div>

          <div>
            <label className="field-label">Applicable Airlines (comma-separated)</label>
            <input className="field-input" placeholder="EK, QR, SQ (leave blank for all)" value={(form.applicable_airlines || []).join(', ')} onChange={e => setForm(f => ({
            ...f,
            applicable_airlines: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          }))} />
          </div>

          <div>
            <label className="field-label">Applicable Terminals (comma-separated)</label>
            <input className="field-input" placeholder="T1, T2 (leave blank for all)" value={(form.applicable_terminals || []).join(', ')} onChange={e => setForm(f => ({
            ...f,
            applicable_terminals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          }))} />
          </div>

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

        {/* Scoring Criteria Editor */}
        <div className="mt-5">
          <label className="field-label mb-2 block">Scoring Criteria</label>
          <div className="card p-3 space-y-2">
            {Object.entries(form.scoring_criteria).map(([k, v]) => <div key={k} className="flex items-center gap-2">
                <span className="flex-1 font-mono text-sm text-secondary">{k}</span>
                <input className="w-20 field-input text-center py-1 text-sm" type="number" value={v} onChange={e => setForm(f => ({
              ...f,
              scoring_criteria: {
                ...f.scoring_criteria,
                [k]: parseFloat(e.target.value) || 0
              }
            }))} />
                <button onClick={() => removeCriteria(k)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={12} />
                </button>
              </div>)}
            {/* Add new */}
            <div className="flex items-center gap-2 pt-2 border-t border-surface-3">
              <input className="flex-1 field-input py-1 text-sm" placeholder="criteria_name" value={newCriteriaKey} onChange={e => setNewCriteriaKey(e.target.value)} />
              <input className="w-20 field-input text-center py-1 text-sm" type="number" placeholder="score" value={newCriteriaVal} onChange={e => setNewCriteriaVal(e.target.value)} />
              <button className="btn-secondary text-xs px-2 py-1" onClick={addCriteria}>+ Add</button>
            </div>
          </div>
          <p className="text-xs text-muted mt-1">Higher scores = stronger preference for this allocation</p>
        </div>
      </Modal>
    </AuthLayout>;
}
