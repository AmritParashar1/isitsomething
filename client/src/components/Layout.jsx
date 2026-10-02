import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, CalendarDays, CheckSquare, BarChart2,
  Settings, LogOut, Menu, X, Zap,
} from 'lucide-react';

const navItems = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/plan',      label: 'Today',       icon: Zap },
  { to: '/tasks',     label: 'Tasks',       icon: CheckSquare },
  { to: '/review',    label: 'Review',      icon: BarChart2 },
  { to: '/settings',  label: 'Settings',    icon: Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const go = (path) => { navigate(path); setSidebarOpen(false); };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="nav-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>📅</div>
            <span className="nav-logo-text">DayPlanner</span>
          </div>
        </div>

        <nav className="nav-items">
          <p className="section-title" style={{ padding: '0 12px', marginBottom: '8px' }}>Navigation</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              className={`nav-item ${location.pathname === to ? 'active' : ''}`}
              onClick={() => go(to)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="nav-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }} onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>DayPlanner</span>
          <div style={{ width: 36 }} />
        </div>

        {children}
      </main>
    </div>
  );
}
