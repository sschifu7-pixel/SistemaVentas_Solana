import React from 'react';
import { ExternalLink, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useProgram();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start space-x-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-matte-900/95 border-gold-500/50 text-gray-100 shadow-gold-sm'
              : toast.type === 'error'
              ? 'bg-matte-900/95 border-red-500/50 text-gray-100 shadow-lg'
              : 'bg-matte-900/95 border-gold-500/30 text-gray-100'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-gold-400" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-gold-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black tracking-tight text-white">{toast.title}</h4>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed break-words">{toast.message}</p>
            {toast.txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${toast.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center space-x-1.5 text-xs text-gold-400 hover:text-gold-300 hover:underline font-bold transition-colors"
              >
                <span>Ver en Solana Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gold-400 transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
