import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Toast } from '../components/ui/Toast';

const ToastContext = createContext(null);

// Duração padrão por tipo (erros ficam mais tempo, para dar tempo de ler)
const DEFAULT_DURATION = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
};

const MAX_TOASTS = 3;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'info', duration) => {
      if (!message) return;
      const id = nextId.current++;
      const ms = duration ?? DEFAULT_DURATION[type] ?? 4000;

      setToasts((prev) => {
        // Evita empilhar toasts idênticos (ex.: duplo clique)
        if (prev.some((t) => t.message === message && t.type === type)) return prev;
        // Mantém no máximo MAX_TOASTS: descarta o mais antigo
        const next = [...prev, { id, message, type }];
        return next.slice(-MAX_TOASTS);
      });

      timers.current[id] = setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  // API simples: toast.success('...'), toast.error('...')
  const api = useMemo(
    () => ({
      show,
      success: (msg, ms) => show(msg, 'success', ms),
      error: (msg, ms) => show(msg, 'error', ms),
      warning: (msg, ms) => show(msg, 'warning', ms),
      info: (msg, ms) => show(msg, 'info', ms),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Container: topo, centralizado no mobile e canto superior direito no desktop.
          z-[70] fica acima dos modais (z-50 e z-[60] do dropdown). */}
      <div
        className="
          pointer-events-none fixed inset-x-0 top-0 z-[70]
          flex flex-col gap-2 items-center
          px-4 pt-[calc(env(safe-area-inset-top)+4.5rem)]
          md:inset-x-auto md:right-4 md:items-end md:px-0 md:w-96
        "
      >
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} message={t.message} type={t.type} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return ctx;
}