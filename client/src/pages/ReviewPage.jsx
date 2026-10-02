import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { schedulesAPI } from '../api';
import { CheckCircle, XCircle, Clock, BarChart2, AlertTriangle } from 'lucide-react';

function DayReview({ date }) {
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      schedulesAPI.getProgress(date).catch(() => ({ data: null })),
      schedulesAPI.get(date).catch(() => ({ data: { schedule: null } })),
    ]).then(([pRes, sRes]) => {
      setData(pRes.data);
      setSchedule(sRes.data.schedule);
    }).finally(() => setLoading(false));
  }, [date]);

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-3)' }}>Loading…</div>;
  if (!schedule) return <div style={{ padding: '20px', color: 'var(--text-3)' }}>No schedule for this day.</div>;

  const blocks = schedule.blocks.filter(b => b.type === 'task');
  const rate = data?.completionRate || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { label: 'Planned', count: blocks.length, color: 'var(--accent-light)', Icon: Clock },
          { label: 'Done', count: data?.completed || 0, color: 'var(--success)', Icon: CheckCircle },
          { label: 'Missed', count: data?.missed || 0, color: 'var(--danger)', Icon: XCircle },
        ].map(({ label, count, color, Icon }) => (
          <div key={label} style={{
            flex: 1, minWidth: 100,
            padding: '12px 14px',
            background: `${color}10`,
            border: `1px solid ${color}30`,
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Icon size={18} color={color} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{count}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{label}</div>
            </div>
          </div>
        ))}
        <div style={{
          flex: 1, minWidth: 100, padding: '12px 14px',
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{rate}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Completion</div>
          {/* Mini bar */}
          <div style={{ marginTop: '6px', background: 'var(--bg-3)', borderRadius: 4, height: 4 }}>
            <div style={{
              width: `${rate}%`, height: '100%', borderRadius: 4,
              background: rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warning)' : 'var(--danger)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Block list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {blocks.map((b, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {b.status === 'completed'  && <CheckCircle size={14} color="var(--success)" />}
            {b.status === 'missed'     && <XCircle size={14} color="var(--danger)" />}
            {b.status === 'skipped'    && <AlertTriangle size={14} color="var(--warning)" />}
            {b.status === 'pending'    && <Clock size={14} color="var(--text-3)" />}
            <span style={{
              flex: 1, fontWeight: 500,
              textDecoration: b.status === 'completed' ? 'line-through' : 'none',
              color: b.status === 'completed' ? 'var(--text-3)' : 'var(--text-1)',
            }}>{b.title}</span>
            <span style={{ color: 'var(--text-3)' }}>{b.startTime} – {b.endTime}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d') };
  });

  return (
    <div>
      <div className="page-header" style={{ padding: '20px 28px', paddingBottom: 0 }}>
        <div style={{ paddingBottom: '16px' }}>
          <h1>Review</h1>
          <p>Planned vs actual — see your real patterns.</p>
        </div>
      </div>

      <div className="page-body">
        {/* Date selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {dates.map(d => (
            <button
              key={d.value}
              className="btn btn-sm"
              style={{
                background: selectedDate === d.value ? 'var(--accent)' : 'var(--bg-glass)',
                color: selectedDate === d.value ? '#fff' : 'var(--text-2)',
                border: `1px solid ${selectedDate === d.value ? 'var(--accent)' : 'var(--border)'}`,
              }}
              onClick={() => setSelectedDate(d.value)}
            >
              {d.value === today ? 'Today' : d.label}
            </button>
          ))}
        </div>

        <div className="card card-body fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={16} color="var(--accent-light)" />
            <h3>{selectedDate === today ? "Today's Review" : dates.find(d => d.value === selectedDate)?.label}</h3>
          </div>
          <DayReview date={selectedDate} />
        </div>
      </div>
    </div>
  );
}
