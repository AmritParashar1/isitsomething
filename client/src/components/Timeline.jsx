import { useState } from 'react';
import { schedulesAPI } from '../api';
import { useApp } from '../context/AppContext';
import { Clock, CheckCircle, XCircle, SkipForward, MoreVertical, Flag } from 'lucide-react';

const typeColors = {
  task:       null, // uses block.color
  commitment: '#8b5cf6',
  break:      '#374151',
  buffer:     '#374151',
};

const statusIcons = {
  completed:  <CheckCircle size={14} color="var(--success)" />,
  missed:     <XCircle size={14} color="var(--danger)" />,
  skipped:    <SkipForward size={14} color="var(--warning)" />,
  in_progress: <Clock size={14} color="var(--warning)" style={{ animation: 'pulse 1.5s infinite' }} />,
};

function BlockEditModal({ block, scheduleId, onClose, onSaved }) {
  const { addToast } = useApp();
  const [status, setStatus] = useState(block.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      if (status !== block.status && ['missed', 'skipped', 'deferred'].includes(status)) {
        await schedulesAPI.logEvent({
          eventType: status === 'skipped' ? 'skipped' : status === 'deferred' ? 'deferred' : 'missed',
          taskId: block.taskId || null,
          blockTitle: block.title,
          reason: reason || null,
        });
      }
      await schedulesAPI.updateBlock(scheduleId, block._id, { status });
      addToast('Block updated.', 'success');
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update block.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{block.title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="tag"><Clock size={12} /> {block.startTime} – {block.endTime}</span>
            <span className="tag">{block.durationMinutes} min</span>
            <span className="tag" style={{ textTransform: 'capitalize' }}>{block.type}</span>
          </div>

          <div className="form-group">
            <label className="label">Status</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed ✓</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>

          {['missed', 'skipped', 'deferred'].includes(status) && (
            <div className="form-group">
              <label className="label">Reason (optional)</label>
              <input
                className="input"
                placeholder="What happened?"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
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

export default function Timeline({ schedule, onUpdate }) {
  const [editing, setEditing] = useState(null);

  if (!schedule || schedule.blocks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No schedule yet</h3>
        <p>Use the AI chat or click "Generate Schedule" to create your day plan.</p>
      </div>
    );
  }

  const blocks = schedule.blocks;

  return (
    <div className="timeline-container">
      {schedule.overloaded && (
        <div className="overload-banner" style={{ marginBottom: '16px' }}>
          ⚠️ {schedule.generationNote}
        </div>
      )}

      {schedule.isCommitted && (
        <div className="committed-badge" style={{ marginBottom: '16px' }}>
          <CheckCircle size={13} /> Committed Plan
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {blocks.map((block, i) => {
          const bg = typeColors[block.type] || block.color || '#6366f1';
          const isDone = block.status === 'completed';
          const isMissed = ['missed', 'skipped'].includes(block.status);

          return (
            <div
              key={block._id || i}
              className={`timeline-block ${isDone ? 'completed' : ''} ${isMissed ? 'missed' : ''}`}
              style={{
                background: `${bg}18`,
                borderColor: `${bg}44`,
                color: bg,
                cursor: block.type === 'task' ? 'pointer' : 'default',
              }}
              onClick={() => block.type === 'task' && !block.isFixed && setEditing(block)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {statusIcons[block.status]}
                    <span style={{
                      fontSize: '14px', fontWeight: 600, color: 'var(--text-1)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {block.title}
                    </span>
                    {block.isFixed && (
                      <span className="badge badge-info" style={{ flexShrink: 0, fontSize: '10px' }}>Fixed</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                    <span className="time-label">{block.startTime} – {block.endTime}</span>
                    <span className="time-label">·</span>
                    <span className="time-label">{block.durationMinutes} min</span>
                  </div>
                </div>
                {block.type === 'task' && !block.isFixed && (
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--text-3)', padding: '2px', flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); setEditing(block); }}
                  >
                    <MoreVertical size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {schedule.unscheduledTasks?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p className="section-title" style={{ marginBottom: '8px' }}>⚠️ Didn't Fit</p>
          {schedule.unscheduledReasons?.map((r, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-2)',
              marginBottom: '4px',
            }}>
              {r.reason}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BlockEditModal
          block={editing}
          scheduleId={schedule._id}
          onClose={() => setEditing(null)}
          onSaved={onUpdate}
        />
      )}
    </div>
  );
}
