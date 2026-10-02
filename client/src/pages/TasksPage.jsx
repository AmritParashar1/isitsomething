import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Edit2, Star, Flag, Clock, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';

const priorities = ['low', 'medium', 'high', 'urgent'];

function TaskModal({ task, onClose, onSaved }) {
  const { addToast } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    estimatedDuration: task?.estimatedDuration || 60,
    priority: task?.priority || 'medium',
    mustDo: task?.mustDo || false,
    deadline: task?.deadline ? task.deadline.slice(0, 10) : '',
    notes: task?.notes || '',
    scheduledDate: task?.scheduledDate || today,
    splittable: task?.splittable || false,
  });
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async () => {
    if (!form.title.trim()) return addToast('Title is required.', 'error');
    setLoading(true);
    try {
      if (task) {
        await tasksAPI.update(task._id, form);
        addToast('Task updated.', 'success');
      } else {
        await tasksAPI.create({ ...form, estimatedDuration: Number(form.estimatedDuration) });
        addToast('Task created!', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save task.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" name="title" value={form.title} onChange={handle} placeholder="e.g. Study DBMS" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input textarea" name="description" value={form.description} onChange={handle} placeholder="Optional details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Duration (min)</label>
              <input className="input" name="estimatedDuration" type="number" min={5} step={5} value={form.estimatedDuration} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="select" name="priority" value={form.priority} onChange={handle}>
                {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Scheduled For</label>
              <input className="input" name="scheduledDate" type="date" value={form.scheduledDate} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="label">Deadline</label>
              <input className="input" name="deadline" type="date" value={form.deadline} onChange={handle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" name="mustDo" checked={form.mustDo} onChange={handle} />
              <Star size={14} color="var(--warning)" /> Must-Do
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" name="splittable" checked={form.splittable} onChange={handle} />
              Splittable
            </label>
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea className="input textarea" name="notes" value={form.notes} onChange={handle} placeholder="Additional context..." style={{ minHeight: 60 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? <span className="spinner" /> : (task ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  );
}

const statusColors = {
  pending:     'var(--text-3)',
  scheduled:   'var(--accent-light)',
  in_progress: 'var(--warning)',
  completed:   'var(--success)',
  missed:      'var(--danger)',
  deferred:    'var(--accent-2)',
};

export default function TasksPage() {
  const { addToast } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | task object
  const [filter, setFilter] = useState('all');
  const [quickInput, setQuickInput] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await tasksAPI.list({});
      setTasks(res.data.tasks || []);
    } catch {
      addToast('Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await tasksAPI.delete(id);
    setTasks(t => t.filter(x => x._id !== id));
    addToast('Task deleted.', 'info');
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await tasksAPI.updateStatus(task._id, { status: newStatus });
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
  };

  // Quick multi-task entry: "Study DBMS 2h, DSA 90m, Gym 1h"
  const quickAdd = async () => {
    if (!quickInput.trim()) return;
    setQuickLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const lines = quickInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const durationMatch = line.match(/(\d+(\.\d+)?)\s*(h|hr|hour|hours|m|min|mins|minutes)/i);
      let estimatedDuration = 60;
      if (durationMatch) {
        const val = parseFloat(durationMatch[1]);
        const unit = durationMatch[3].toLowerCase();
        estimatedDuration = unit.startsWith('h') ? Math.round(val * 60) : Math.round(val);
      }
      const title = line.replace(/(\d+(\.\d+)?)\s*(h|hr|hour|hours|m|min|mins|minutes)/i, '').trim();
      return { title: title || line, estimatedDuration, priority: 'medium', scheduledDate: today };
    });

    try {
      const res = await tasksAPI.create(parsed.length === 1 ? parsed[0] : parsed);
      setQuickInput('');
      addToast(`${Array.isArray(res.data.tasks) ? res.data.tasks.length : 1} task(s) added!`, 'success');
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add tasks.', 'error');
    } finally {
      setQuickLoading(false);
    }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'mustdo') return t.mustDo;
    if (filter === 'today') return t.scheduledDate === format(new Date(), 'yyyy-MM-dd');
    return t.status === filter;
  });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Done' },
    { key: 'mustdo', label: '⭐ Must-Do' },
    { key: 'deferred', label: 'Deferred' },
  ];

  return (
    <div>
      <div className="page-header" style={{ padding: '20px 28px', paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px' }}>
          <h1>Tasks</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Quick multi-add */}
        <div className="card card-body" style={{ marginBottom: '20px' }}>
          <p className="section-title" style={{ marginBottom: '8px' }}>⚡ Quick Add</p>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '10px' }}>
            Comma-separate tasks with durations: "Study DBMS 2h, DSA 90m, Gym 1h"
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              placeholder="Study DBMS 2h, DSA 90m, Gym 1h"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && quickAdd()}
            />
            <button className="btn btn-primary" onClick={quickAdd} disabled={quickLoading || !quickInput.trim()}>
              {quickLoading ? <span className="spinner" /> : <Plus size={16} />}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {filters.map(f => (
            <button
              key={f.key}
              className="btn btn-sm"
              style={{
                background: filter === f.key ? 'var(--accent)' : 'var(--bg-glass)',
                color: filter === f.key ? '#fff' : 'var(--text-2)',
                border: `1px solid ${filter === f.key ? 'var(--accent)' : 'var(--border)'}`,
              }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No tasks here</h3>
            <p>Create a task or tell the AI planner what you want to do today.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(task => (
              <div key={task._id} className="card fade-in" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Checkbox */}
                  <button
                    style={{
                      width: 22, height: 22, borderRadius: '6px', flexShrink: 0, marginTop: '2px',
                      border: `2px solid ${task.status === 'completed' ? 'var(--success)' : 'var(--border)'}`,
                      background: task.status === 'completed' ? 'var(--success)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all var(--transition)',
                    }}
                    onClick={() => toggleComplete(task)}
                  >
                    {task.status === 'completed' && <CheckCircle size={13} color="#fff" />}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontWeight: 600, fontSize: '14px',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'var(--text-3)' : 'var(--text-1)',
                      }}>
                        {task.title}
                      </span>
                      {task.mustDo && <Star size={13} color="var(--warning)" fill="var(--warning)" />}
                      <span className={`badge badge-${task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {task.estimatedDuration} min
                      </span>
                      <span style={{ fontSize: '12px', color: statusColors[task.status] || 'var(--text-3)', textTransform: 'capitalize' }}>
                        ● {task.status?.replace('_', ' ')}
                      </span>
                      {task.deferralCount > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
                          Deferred {task.deferralCount}×
                        </span>
                      )}
                      {task.scheduledDate && (
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                          📅 {task.scheduledDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setModal(task)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteTask(task._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
