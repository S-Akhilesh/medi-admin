import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import '../components/ui/Toast.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION_MS = 4500;

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast]
  );

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);

  const value: ToastContextType = {
    toasts,
    addToast,
    success,
    error,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.variant}`}
          role="alert"
          onClick={() => removeToast(t.id)}
        >
          <span className="toast-icon">
            {t.variant === 'success' && '✓'}
            {t.variant === 'error' && '✕'}
            {t.variant === 'warning' && '⚠'}
            {t.variant === 'info' && 'ℹ'}
          </span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
