import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { authAPI, commitmentsAPI } from '../api';
import { Save, Plus, Trash2, X, Settings } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function CommitmentModal({ commitment, onClose, onSaved }) {
  const { addToast } = useApp();
  const [form, setForm] = useState({
    title: commitment?.title || '',
    startTime: commitment?.startTime || '09:00',
    endTime: commitment?.endTime || '10:00',
    color: commitment?.color || '#8b5cf6',
    recurrenceType: commitment?.recurrence?.type || 'weekly',
    daysOfWeek: commitment?.recurrence?.daysOfWeek || [],
    specificDate: commitment?.recurrence?.specificDate || '',
    notes: commitment?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d)
        ? f.daysOfWeek.filter(x => x !== d)
        : [...f.daysOfWeek, d],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) return addToast('Title required.', 'error');
    setLoading(true);
    const data = {
      title: form.title,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
      notes: form.notes,
      recurrence: {
        type: form.recurrenceType,
        daysOfWeek: form.daysOfWeek,
        specificDate: form.specificDate || null,
      },
    };
    try {
      if (commitment) {
        await commitmentsAPI.update(commitment._id, data);
        addToast('Commitment updated.', 'success');
      } else {
        await commitmentsAPI.create(data);
        addToast('Commitment added!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{commitment ? 'Edit Commitment' : 'New Commitment'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. DBMS Lecture" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Start Time</label>
              <input className="input" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">End Time</label>
              <input className="input" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Recurrence</label>
            <select className="select" value={form.recurrenceType} onChange={e => setForm(f => ({ ...f, recurrenceType: e.target.value }))}>
              <option value="daily">Every day</option>
              <option value="weekly">Specific days of the week</option>
              <option value="none">One-time (specific date)</option>
            </select>
          </div>
          {form.recurrenceType === 'weekly' && (
            <div>
              <label className="label" style={{ marginBottom: '8px' }}>Days</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: form.daysOfWeek.includes(i) ? 'var(--accent)' : 'var(--bg-2)',
                      border: `2px solid ${form.daysOfWeek.includes(i) ? 'var(--accent)' : 'var(--border)'}`,
                      color: form.daysOfWeek.includes(i) ? '#fff' : 'var(--text-3)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                    onClick={() => toggleDay(i)}
                  >
                    {d.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {form.recurrenceType === 'none' && (
            <div className="form-group">
              <label className="label">Date</label>
              <input className="input" type="date" value={form.specificDate} onChange={e => setForm(f => ({ ...f, specificDate: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {DAY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer', transition: 'all var(--transition)',
                  }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, addToast } = useApp();
  const [prefs, setPrefs] = useState({ ...user?.preferences });
  const [saving, setSaving] = useState(false);
  const [commitments, setCommitments] = useState([]);
  const [commModal, setCommModal] = useState(null);

  const fetchCommitments = useCallback(async () => {
    const res = await commitmentsAPI.list({});
    setCommitments(res.data.commitments || []);
  }, []);

  useEffect(() => { fetchCommitments(); }, [fetchCommitments]);

  const savePrefs = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updatePreferences(prefs);
      updateUser(res.data.user);
      addToast('Preferences saved!', 'success');
    } catch {
      addToast('Failed to save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCommitment = async (id) => {
    await commitmentsAPI.delete(id);
    setCommitments(c => c.filter(x => x._id !== id));
    addToast('Commitment removed.', 'info');
  };

  const pref = (key, val) => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="page-header" style={{ padding: '20px 28px', paddingBottom: 0 }}>
        <div style={{ paddingBottom: '16px' }}>
          <h1>Settings</h1>
          <p>Preferences and fixed commitments.</p>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Working hours */}
        <div className="card card-body">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="var(--accent-light)" /> Planning Preferences
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {[
              { key: 'workStartTime', label: 'Work Start', type: 'time' },
              { key: 'workEndTime', label: 'Work End', type: 'time' },
              { key: 'dayStartTime', label: 'Day Start', type: 'time' },
              { key: 'dayEndTime', label: 'Day End', type: 'time' },
            ].map(({ key, label, type }) => (
              <div className="form-group" key={key}>
                <label className="label">{label}</label>
                <input className="input" type={type} value={prefs?.[key] || ''} onChange={e => pref(key, e.target.value)} />
              </div>
            ))}
            {[
              { key: 'breakDuration', label: 'Break (min)', min: 0, max: 60 },
              { key: 'defaultTaskDuration', label: 'Default Task (min)', min: 15, max: 180 },
              { key: 'reminderLeadTime', label: 'Reminder Lead (min)', min: 0, max: 30 },
            ].map(({ key, label, min, max }) => (
              <div className="form-group" key={key}>
                <label className="label">{label}</label>
                <input className="input" type="number" min={min} max={max} value={prefs?.[key] || 0} onChange={e => pref(key, Number(e.target.value))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={prefs?.enableReminders || false} onChange={e => pref('enableReminders', e.target.checked)} />
              Enable block reminders
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={prefs?.enableMorningPrompt || false} onChange={e => pref('enableMorningPrompt', e.target.checked)} />
              Enable morning prompt
            </label>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={savePrefs} disabled={saving}>
              {saving ? <span className="spinner" /> : <Save size={14} />} Save Preferences
            </button>
          </div>
        </div>

        {/* Commitments */}
        <div className="card card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>Fixed Commitments</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setCommModal('new')}>
              <Plus size={14} /> Add
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '12px' }}>
            College classes, gym, meals — blocks that cannot be moved by the scheduler.
          </p>
          {commitments.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-3)', textAlign: 'center', padding: '20px' }}>
              No commitments yet. Add your college timetable here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {commitments.map(c => (
                <div key={c._id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  background: `${c.color}18`,
                  border: `1px solid ${c.color}44`,
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: c.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{c.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {c.startTime} – {c.endTime} ·{' '}
                      {c.recurrence.type === 'daily' ? 'Every day' :
                       c.recurrence.type === 'weekly' ? `${c.recurrence.daysOfWeek.map(d => DAYS[d]).join(', ')}` :
                       c.recurrence.specificDate || 'One-time'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setCommModal(c)}>
                      <Settings size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteCommitment(c._id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {commModal && (
        <CommitmentModal
          commitment={commModal === 'new' ? null : commModal}
          onClose={() => setCommModal(null)}
          onSaved={fetchCommitments}
        />
      )}
    </div>
  );
}
