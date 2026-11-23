import React, { useState } from 'react';
import { Store, Sparkles, X } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

interface InitBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InitBusinessModal: React.FC<InitBusinessModalProps> = ({ isOpen, onClose }) => {
  const { initializeBusiness, businessPda } = useProgram();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await initializeBusiness(name.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-matte-900 border border-gold-500/40 rounded-3xl max-w-md w-full p-8 shadow-2xl relative shadow-gold-md">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gold-400 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gold-metallic p-0.5 shadow-gold-sm">
            <div className="h-full w-full bg-matte-950 rounded-[14px] flex items-center justify-center">
              <Store className="h-6 w-6 text-gold-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Inicializar Negocio</h3>
            <p className="text-xs text-gray-400">Crea la cuenta PDA de tu comercio en Solana Devnet</p>
          </div>
        </div>

        {businessPda && (
          <div className="mb-5 p-3.5 bg-matte-950 rounded-2xl border border-gold-500/25 text-xs shadow-inner-matte">
            <span className="text-gray-400 block mb-1 text-[11px] font-bold uppercase tracking-wider">PDA Derivada del Negocio:</span>
            <code className="text-gold-300 break-all font-mono text-[11px]">{businessPda.toBase58()}</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Nombre Comercial
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Boutique Solana Luxury"
              className="w-full px-4 py-3 bg-matte-950 border border-gold-500/30 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200 text-sm"
            />
            <span className="text-[11px] text-gray-500 mt-1.5 block">Máximo 50 caracteres.</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gold-metallic text-matte-950 font-black text-sm uppercase tracking-wider hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <span>Confirmando en Wallet...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-matte-950" />
                  <span>Crear Cuenta PDA de Negocio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
