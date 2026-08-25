import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemoveRef.current();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-slate-900/95';
      case 'error':
        return 'border-red-500/30 bg-slate-900/95';
      case 'warning':
        return 'border-amber-500/30 bg-slate-900/95';
      default:
        return 'border-indigo-500/30 bg-slate-900/95';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-pop ${getBorderColor()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex flex-col flex-1">
        <span className="text-xs font-bold text-white">{toast.title}</span>
        {toast.description && (
          <span className="text-[11px] text-slate-300 mt-0.5">{toast.description}</span>
        )}
      </div>
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
