import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { schedulesAPI, tasksAPI } from '../api';
import { useApp } from '../context/AppContext';
import { CheckCircle, Clock, XCircle, TrendingUp, Star, AlertTriangle } from 'lucide-react';

function ProgressRing({ value, size = 80, stroke = 6, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle className="progress-ring-track" r={r} cx={size/2} cy={size/2} strokeWidth={stroke} />
      <circle
        className="progress-ring-fill"
        r={r} cx={size/2} cy={size/2}
        strokeWidth={stroke}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [schedule, setSchedule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      schedulesAPI.get(today).catch(() => ({ data: { schedule: null } })),
      schedulesAPI.getProgress(today).catch(() => ({ data: null })),
      tasksAPI.list({ date: today }).catch(() => ({ data: { tasks: [] } })),
    ]).then(([sRes, pRes, tRes]) => {
      setSchedule(sRes.data.schedule);
      setProgress(pRes.data);
      setTasks(tRes.data.tasks || []);
    }).finally(() => setLoading(false));
  }, [today]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const nextBlock = schedule?.blocks?.find(b =>
    b.status === 'pending' && b.type === 'task'
  );

  const mustDoTasks = tasks.filter(t => t.mustDo);
  const mustDoDone = mustDoTasks.filter(t => t.status === 'completed').length;

  const completionRate = progress?.completionRate || 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ padding: '24px 32px' }}>
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card fade-in">
            <div className="stat-label">Completion</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ProgressRing value={completionRate} size={56} stroke={5} />
              <div>
                <div className="stat-value" style={{ fontSize: '22px' }}>{completionRate}%</div>
                <div className="stat-sub">{progress?.completed || 0} of {progress?.total || 0} tasks</div>
              </div>
            </div>
          </div>

          <div className="stat-card fade-in">
            <div className="stat-label">Scheduled</div>
            <div className="stat-value">{schedule?.blocks?.filter(b => b.type === 'task').length || 0}</div>
            <div className="stat-sub">tasks today</div>
          </div>

          <div className="stat-card fade-in">
            <div className="stat-label">Must-Dos</div>
            <div className="stat-value">{mustDoDone}/{mustDoTasks.length}</div>
            <div className="stat-sub">essentials done</div>
          </div>

          <div className="stat-card fade-in">
            <div className="stat-label">Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div className={`status-dot ${schedule?.isCommitted ? 'completed' : 'pending'}`} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {schedule?.isCommitted ? 'Committed' : schedule ? 'Draft' : 'No Plan'}
              </span>
            </div>
            <div className="stat-sub">
              {schedule?.isCommitted ? 'Baseline locked' : 'Not yet committed'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Next block */}
          <div className="card card-body fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={16} color="var(--accent-light)" />
              <h3 style={{ fontSize: '14px' }}>Up Next</h3>
            </div>
            {nextBlock ? (
              <div style={{
                padding: '16px',
                background: `${nextBlock.color || 'var(--accent)'}18`,
                border: `1px solid ${nextBlock.color || 'var(--accent)'}44`,
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-1)' }}>{nextBlock.title}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {nextBlock.startTime} – {nextBlock.endTime} · {nextBlock.durationMinutes} min
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                {schedule ? 'All tasks completed! 🎉' : 'No schedule yet. Go to Today to create one.'}
              </p>
            )}
          </div>

          {/* Must-dos */}
          <div className="card card-body fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Star size={16} color="var(--warning)" />
              <h3 style={{ fontSize: '14px' }}>Must-Dos Today</h3>
            </div>
            {mustDoTasks.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                No must-do tasks. Mark tasks as must-do in the Tasks tab.
              </p>
            ) : (
              <div>
                {mustDoTasks.map(t => (
                  <div key={t._id} className="check-item" style={{ cursor: 'default' }}>
                    <div className={`checkbox ${t.status === 'completed' ? 'checked' : ''}`}>
                      {t.status === 'completed' && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.estimatedDuration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent missed */}
          <div className="card card-body fade-in" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={16} color="var(--accent-2)" />
              <h3 style={{ fontSize: '14px' }}>Today's Progress</h3>
            </div>
            {!schedule ? (
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No schedule found for today.</p>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Completed', count: progress?.completed || 0, color: 'var(--success)', Icon: CheckCircle },
                  { label: 'Missed', count: progress?.missed || 0, color: 'var(--danger)', Icon: XCircle },
                  { label: 'Pending', count: progress?.pending || 0, color: 'var(--text-3)', Icon: Clock },
                ].map(({ label, count, color, Icon }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: '120px',
                    padding: '16px',
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <Icon size={20} color={color} />
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' }}>{count}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
