import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={18} color="var(--success)" />,
  error:   <AlertCircle size={18} color="var(--danger)" />,
  warning: <AlertCircle size={18} color="var(--warning)" />,
  info:    <Info size={18} color="var(--accent-light)" />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast fade-in">
          {icons[t.type] || icons.info}
          <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.5 }}>
            {t.message}
          </div>
          <button className="btn btn-ghost btn-icon" style={{ padding: '4px' }} onClick={() => removeToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
