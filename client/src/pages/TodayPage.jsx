import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { schedulesAPI } from '../api';
import { useApp } from '../context/AppContext';
import Timeline from '../components/Timeline';
import ChatPanel from '../components/ChatPanel';
import { Zap, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

export default function TodayPage() {
  const { addToast, user } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await schedulesAPI.get(today);
      setSchedule(res.data.schedule);
    } catch {
      /* no schedule yet */
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await schedulesAPI.generate(today);
      setSchedule(res.data.schedule);
      addToast('Schedule generated!', 'success');
      if (res.data.note) addToast(res.data.note, 'warning');
    } catch (err) {
      addToast(err.response?.data?.error || 'Generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const commit = async () => {
    setCommitting(true);
    try {
      const res = await schedulesAPI.commit(today);
      setSchedule(res.data.schedule);
      addToast('✅ Plan committed! Your schedule is locked.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not commit.', 'error');
    } finally {
      setCommitting(false);
    }
  };

  const reschedule = async () => {
    setRescheduling(true);
    try {
      const res = await schedulesAPI.reschedule(today);
      setSchedule(res.data.schedule);
      addToast('Schedule updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Reschedule failed.', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const taskBlocks = schedule?.blocks?.filter(b => b.type === 'task') || [];
  const done = taskBlocks.filter(b => b.status === 'completed').length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '20px 28px', paddingBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px' }}>Today's Plan</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {taskBlocks.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {done}/{taskBlocks.length} done
              </span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={generate} disabled={generating}>
              {generating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={13} />}
              Generate
            </button>
            {schedule && !schedule.isCommitted && (
              <button className="btn btn-primary btn-sm" onClick={commit} disabled={committing}>
                {committing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle2 size={13} />}
                Commit
              </button>
            )}
            {schedule?.isCommitted && (
              <div className="committed-badge">
                <CheckCircle2 size={12} /> Committed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Timeline panel */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px',
          borderRight: '1px solid var(--border)',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : (
            <Timeline schedule={schedule} onUpdate={fetchSchedule} />
          )}
        </div>

        {/* Chat panel */}
        <div style={{
          width: '360px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <ChatPanel date={today} onScheduleUpdate={fetchSchedule} />
        </div>
      </div>
    </div>
  );
}
