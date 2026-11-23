import React, { useState, useMemo } from 'react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { UserPlus, Sparkles, X, Dices } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { getCustomerPda } from '../utils/constants';

interface RegisterCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterCustomerModal: React.FC<RegisterCustomerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerCustomer, businessPda } = useProgram();
  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRandomWallet = () => {
    const kp = Keypair.generate();
    setWalletAddress(kp.publicKey.toBase58());
  };

  const derivedCustomerPda = useMemo(() => {
    if (!businessPda || !walletAddress.trim()) return null;
    try {
      const pubkey = new PublicKey(walletAddress.trim());
      const [pda] = getCustomerPda(businessPda, pubkey);
      return pda.toBase58();
    } catch {
      return null;
    }
  }, [businessPda, walletAddress]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    let customerPubkey: PublicKey;
    try {
      customerPubkey = new PublicKey(walletAddress.trim());
    } catch {
      setError('La dirección ingresada no es una clave pública de Solana válida.');
      return;
    }

    try {
      setSubmitting(true);
      await registerCustomer(name.trim(), customerPubkey);
      setName('');
      setWalletAddress('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar cliente');
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
              <UserPlus className="h-6 w-6 text-gold-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Registrar Cliente PDA</h3>
            <p className="text-xs text-gray-400">Vincula un cliente al negocio para acumular compras</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-950/80 border border-red-700/60 rounded-2xl text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Nombre o Alias
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Rodrigo Fernández"
              className="w-full px-4 py-3 bg-matte-950 border border-gold-500/30 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Wallet Pública del Cliente
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomWallet}
                className="text-xs text-gold-400 hover:text-gold-300 font-bold hover:underline flex items-center space-x-1"
              >
                <Dices className="h-3.5 w-3.5" />
                <span>Generar Wallet Demo</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Ej. 7mwiPqiKhkECxyByfuqzjSS1socdp3pvP8WbgpWtkRn5"
              className="w-full px-4 py-3 bg-matte-950 border border-gold-500/30 rounded-2xl text-white font-mono text-xs placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200"
            />
          </div>

          {/* Derivation Preview */}
          {derivedCustomerPda && (
            <div className="p-3.5 bg-matte-950 rounded-2xl border border-gold-500/25 text-xs shadow-inner-matte">
              <span className="text-gray-400 block mb-1 text-[11px] font-bold uppercase tracking-wider">Cuenta PDA Calculada:</span>
              <code className="text-gold-300 font-mono break-all text-[11px] block">
                {derivedCustomerPda}
              </code>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !name.trim() || !walletAddress.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gold-metallic text-matte-950 font-black text-sm uppercase tracking-wider hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <span>Confirmando en Wallet...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-matte-950" />
                  <span>Crear Cuenta PDA de Cliente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
