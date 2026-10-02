import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TodayPage from './pages/TodayPage';
import TasksPage from './pages/TasksPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoutes() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', boxShadow: '0 0 24px var(--accent-glow)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>📅</div>
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<DashboardPage />} />
        <Route path="/plan"     element={<TodayPage />} />
        <Route path="/tasks"    element={<TasksPage />} />
        <Route path="/review"   element={<ReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login"    element={<Navigate to="/" replace />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ProtectedRoutes />
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  );
}
