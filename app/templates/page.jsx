'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AuthLayout from '@/components/rms/AuthLayout';
import Modal from '@/components/ui/Modal';
import { swrFetcher, TemplatesAPI, SWR } from '@/lib/api/client';
import { Plus, Edit2, Trash2, Play, Layers, Info, Loader } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
const TEMPLATE_TYPES = ['daily', 'weekly', 'seasonal', 'event'];
const TYPE_BADGE = {
  daily: 'bg-blue-900/30 text-blue-300',
  weekly: 'bg-purple-900/30 text-purple-300',
  seasonal: 'bg-green-900/30 text-green-300',
  event: 'bg-amber-900/30 text-amber-300'
};
const RESOURCE_TYPES = ['GATE', 'STAND', 'BELT', 'RUNWAY_ARR', 'RUNWAY_DEP', 'CHECKIN_DESK'];
export default function TemplatesPage() {
  const {
    data: templates = [],
    mutate,
    isLoading
  } = useSWR(SWR.templates, swrFetcher);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showApply, setShowApply] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [applyResult, setApplyResult] = useState(null);
  const [form, setForm] = useState({
    template_name: '',
    template_type: 'daily',
    description: '',
    resource_types: [],
    template_data: '{}',
    is_active: true
  });
  const [applyDates, setApplyDates] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });
  function openCreate() {
    setEditing(null);
    setForm({
      template_name: '',
      template_type: 'daily',
      description: '',
      resource_types: [],
      template_data: '{}',
      is_active: true
    });
    setError('');
    setShowModal(true);
  }
  function openEdit(t) {
    setEditing(t);
    setForm({
      template_name: t.template_name,
      template_type: t.template_type,
      description: t.description || '',
      resource_types: t.resource_types || [],
      template_data: JSON.stringify(t.template_data, null, 2),
      is_active: t.is_active
    });
    setError('');
    setShowModal(true);
  }
  async function handleSave() {
    if (!form.template_name.trim()) {
      setError('Template name is required');
      return;
    }
    let data = {};
    try {
      data = JSON.parse(form.template_data);
    } catch {
      setError('Invalid JSON template data');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        template_data: data
      };
      if (editing) {
        await TemplatesAPI.update(editing.template_id, payload);
      } else {
        await TemplatesAPI.create(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }
  async function handleApply() {
    if (!showApply) return;
    setApplying(true);
    try {
      const result = await TemplatesAPI.apply(showApply.template_id, applyDates.date_from, applyDates.date_to);
      setApplyResult(result);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Apply failed');
      setShowApply(null);
    } finally {
      setApplying(false);
    }
  }
  async function handleDelete(t) {
    if (!confirm(`Delete template "${t.template_name}"?`)) return;
    try {
      await TemplatesAPI.delete(t.template_id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }
  function toggleResourceType(rt) {
    setForm(f => ({
      ...f,
      resource_types: f.resource_types.includes(rt) ? f.resource_types.filter(x => x !== rt) : [...f.resource_types, rt]
    }));
  }
  return <AuthLayout title="Allocation Templates">
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Allocation Templates</h2>
            <p className="text-muted text-sm mt-0.5">Reusable allocation patterns for recurring schedules and events</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
            <Plus size={15} /> New Template
          </button>
        </div>

        {/* Template grid */}
        {isLoading ? <div className="flex items-center justify-center h-32 card"><div className="spinner" /></div> : templates.length === 0 ? <div className="card flex flex-col items-center justify-center h-40 text-muted">
            <Layers size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No templates yet</p>
            <button className="btn-primary text-xs px-3 py-1.5 mt-3" onClick={openCreate}>Create First Template</button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(t => <div key={t.template_id} className={clsx('card p-5 flex flex-col gap-3', !t.is_active && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('text-xs font-mono px-1.5 py-0.5 rounded', TYPE_BADGE[t.template_type])}>
                        {t.template_type}
                      </span>
                      {!t.is_active && <span className="text-xs text-muted">Inactive</span>}
                    </div>
                    <h3 className="font-semibold truncate">{t.template_name}</h3>
                    {t.description && <p className="text-sm text-muted mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(t.resource_types || []).map(rt => <span key={rt} className="text-xs font-mono bg-surface-3 px-1.5 py-0.5 rounded text-secondary">{rt}</span>)}
                </div>

                <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-surface-3">
                  <span>Used {t.used_count ?? 0}×</span>
                  <span>Updated {format(parseISO(t.updated_at || t.created_at), 'MMM dd')}</span>
                </div>

                <div className="flex items-center gap-2">
                  {t.is_active && <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-1" onClick={() => {
              setShowApply(t);
              setApplyResult(null);
            }}>
                      <Play size={12} /> Apply
                    </button>}
                  <button className="btn-ghost p-1.5" onClick={() => openEdit(t)}><Edit2 size={13} /></button>
                  <button className="btn-ghost p-1.5 text-red-400" onClick={() => handleDelete(t)}><Trash2 size={13} /></button>
                </div>
              </div>)}
          </div>}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Template' : 'New Allocation Template'} subtitle="Define a reusable allocation pattern" size="lg" footer={<div className="flex items-center gap-3 justify-end">
            {error && <p className="text-red-400 text-sm flex-1">{error}</p>}
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Template Name *</label>
            <input className="field-input" placeholder="e.g. Summer Weekday Peak Schedule" value={form.template_name} onChange={e => setForm(f => ({
            ...f,
            template_name: e.target.value
          }))} />
          </div>
          <div>
            <label className="field-label">Template Type</label>
            <select className="field-select" value={form.template_type} onChange={e => setForm(f => ({
            ...f,
            template_type: e.target.value
          }))}>
              {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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
          <div className="col-span-2">
            <label className="field-label">Description</label>
            <textarea className="field-input" rows={2} placeholder="Describe when and how this template is used" value={form.description} onChange={e => setForm(f => ({
            ...f,
            description: e.target.value
          }))} />
          </div>
          <div className="col-span-2">
            <label className="field-label mb-2 block">Applicable Resource Types</label>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map(rt => <button key={rt} type="button" onClick={() => toggleResourceType(rt)} className={clsx('text-xs px-2 py-1 rounded border transition-colors', form.resource_types.includes(rt) ? 'border-accent-blue bg-accent-blue/20 text-primary' : 'border-surface-4 text-muted')}>
                  {rt}
                </button>)}
            </div>
          </div>
          <div className="col-span-2">
            <label className="field-label">Template Data (JSON)</label>
            <textarea className="field-input font-mono text-sm" rows={6} placeholder='{"time_windows": [{"start": "06:00", "end": "22:00"}], "priority_airlines": ["EK", "EY"]}' value={form.template_data} onChange={e => setForm(f => ({
            ...f,
            template_data: e.target.value
          }))} />
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <Modal open={!!showApply} onClose={() => {
      setShowApply(null);
      setApplyResult(null);
    }} title={`Apply Template: ${showApply?.template_name}`} subtitle="Select date range to apply this allocation template" size="md" footer={!applyResult ? <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowApply(null)}>Cancel</button>
              <button className="btn-primary flex items-center gap-2" disabled={applying} onClick={handleApply}>
                {applying ? <><Loader size={13} className="animate-spin" /> Applying…</> : <><Play size={13} /> Apply Template</>}
              </button>
            </div> : <div className="flex justify-end">
              <button className="btn-primary" onClick={() => {
        setShowApply(null);
        setApplyResult(null);
      }}>Done</button>
            </div>}>
        {applyResult ? <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
              <Play size={24} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-400">Template Applied!</p>
              <p className="text-muted text-sm mt-1">
                Created <span className="text-primary font-semibold">{applyResult.allocations_created}</span> allocations
              </p>
            </div>
          </div> : <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">From Date</label>
              <input className="field-input" type="date" value={applyDates.date_from} onChange={e => setApplyDates(d => ({
            ...d,
            date_from: e.target.value
          }))} />
            </div>
            <div>
              <label className="field-label">To Date</label>
              <input className="field-input" type="date" value={applyDates.date_to} onChange={e => setApplyDates(d => ({
            ...d,
            date_to: e.target.value
          }))} />
            </div>
            <div className="col-span-2 bg-surface-2 rounded-lg p-3 flex items-start gap-2 text-sm text-muted">
              <Info size={14} className="text-accent-blue flex-shrink-0 mt-0.5" />
              <span>Applying this template will create allocation entries for all days in the selected range based on the template's pattern.</span>
            </div>
          </div>}
      </Modal>
    </AuthLayout>;
}
