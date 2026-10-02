import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%), var(--bg-0)',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 0 24px var(--accent-glow)',
            }}>📅</div>
            <span style={{
              fontSize: '22px', fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent-light), var(--accent-2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>DayPlanner</span>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>
            Your AI-powered daily planning companion
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)',
            padding: '4px', marginBottom: '24px',
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontWeight: 600,
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-3)',
                  transition: 'all var(--transition)',
                  textTransform: 'capitalize',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="label">Your Name</label>
                <input
                  className="input"
                  name="name"
                  placeholder="e.g. Amrit"
                  value={form.name}
                  onChange={handle}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handle}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--danger)', fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px', width: '100%' }}>
              {loading ? <span className="spinner" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-3)' }}>
              New here?{' '}
              <button
                onClick={() => setMode('register')}
                style={{ color: 'var(--accent-light)', background: 'none', fontWeight: 600 }}
              >
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
