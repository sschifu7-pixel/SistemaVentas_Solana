import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Award,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Power,
  Copy,
  Search,
  Check,
} from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { formatSol, truncateAddress } from '../utils/constants';
import { CustomerAccount } from '../types';

interface CustomerExpedientViewProps {
  onOpenRegisterModal: () => void;
}

export const CustomerExpedientView: React.FC<CustomerExpedientViewProps> = ({
  onOpenRegisterModal,
}) => {
  const { customers, setCustomerStatus, closeCustomer, business } = useProgram();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer.toBase58().toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.publicKey.toBase58().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async (customer: CustomerAccount) => {
    try {
      setProcessingId(customer.publicKey.toBase58());
      await setCustomerStatus(customer.publicKey, !customer.isActive);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseCustomer = async (customer: CustomerAccount) => {
    if (customer.isActive) {
      const confirmTest = window.confirm(
        'ATENCIÓN: El cliente está ACTIVO. El programa on-chain de Solana rechazará esta operación con el error "CustomerStillActive" según las reglas de negocio del Día 5.\n\n¿Deseas enviar la transacción para probar el Rechazo Controlado?'
      );
      if (!confirmTest) return;
    } else {
      const confirmClose = window.confirm(
        `¿Deseas cerrar definitivamente la cuenta PDA de ${customer.name}? La renta exenta de Solana será reintegrada a la autoridad del negocio.`
      );
      if (!confirmClose) return;
    }

    try {
      setProcessingId(customer.publicKey.toBase58());
      await closeCustomer(customer.publicKey);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-2.5 tracking-tight">
            <Users className="h-7 w-7 text-gold-400" />
            <span>Expediente de Clientes PDA</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Gestión de perfiles, métricas de fidelidad y cierre de cuentas (Baja Día 5)
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          disabled={!business}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gold-metallic text-matte-950 font-black text-xs uppercase tracking-wider hover:shadow-gold-md hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-40"
        >
          <UserPlus className="h-4 w-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, wallet o dirección PDA..."
          className="w-full pl-11 pr-4 py-3.5 bg-matte-900 border border-gold-500/30 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200"
        />
      </div>

      {/* Customer List / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="p-14 text-center bg-matte-900 border border-gold-500/25 rounded-3xl shadow-xl">
          <Users className="h-14 w-14 text-gold-500/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No se encontraron clientes</h3>
          <p className="text-xs text-gray-400 mb-5">
            {searchTerm ? 'No hay coincidencias con la búsqueda ingresada.' : 'Aún no has registrado clientes en este negocio.'}
          </p>
          <button
            onClick={onOpenRegisterModal}
            className="px-5 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold hover:bg-gold-500/20 hover:scale-105 transition-all duration-200"
          >
            Registrar Cliente Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => {
            const pdaStr = c.publicKey.toBase58();
            const walletStr = c.customer.toBase58();
            const isBusy = processingId === pdaStr;

            return (
              <div
                key={pdaStr}
                className="bg-matte-900 border border-gold-500/25 hover:border-gold-400/60 rounded-3xl p-6 space-y-4 shadow-xl hover:shadow-gold-sm transition-all duration-300 relative group overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">{c.name}</h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[11px] text-gray-400">Wallet:</span>
                      <code className="text-xs font-mono text-gray-300">
                        {truncateAddress(walletStr, 5)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(walletStr, `wallet-${pdaStr}`)}
                        className="text-gray-500 hover:text-gold-400 transition-colors p-1"
                        title="Copiar Wallet"
                      >
                        {copiedKey === `wallet-${pdaStr}` ? (
                          <Check className="h-3.5 w-3.5 text-gold-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      c.isActive
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-sm'
                        : 'bg-red-950/80 text-red-400 border border-red-700/60 shadow-sm'
                    }`}
                  >
                    {c.isActive ? (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </span>
                </div>

                {/* PDA Info Box */}
                <div className="p-3.5 bg-matte-950 rounded-2xl border border-gold-500/20 text-xs shadow-inner-matte">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cuenta PDA:</span>
                    <button
                      onClick={() => copyToClipboard(pdaStr, `pda-${pdaStr}`)}
                      className="text-gold-400 hover:text-gold-300 font-bold flex items-center space-x-1 text-[11px] transition-colors"
                    >
                      {copiedKey === `pda-${pdaStr}` ? (
                        <span>✓ Copiado</span>
                      ) : (
                        <span>Copiar PDA</span>
                      )}
                    </button>
                  </div>
                  <code className="text-gold-300 font-mono text-[11px] break-all block">
                    {pdaStr}
                  </code>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3.5 bg-matte-950 rounded-2xl border border-gold-500/20">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-xs mb-1">
                      <Coins className="h-3.5 w-3.5 text-gold-400" />
                      <span className="text-[11px] uppercase font-bold tracking-wider">Volumen</span>
                    </div>
                    <span className="text-lg font-black text-white font-mono tracking-wide">
                      {formatSol(c.totalPurchases)} SOL
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {c.purchasesCount} {c.purchasesCount === 1 ? 'compra' : 'compras'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-matte-950 rounded-2xl border border-gold-500/20">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-xs mb-1">
                      <Award className="h-3.5 w-3.5 text-gold-400" />
                      <span className="text-[11px] uppercase font-bold tracking-wider">Fidelidad</span>
                    </div>
                    <span className="text-lg font-black text-gold-400 font-mono tracking-wide">
                      {c.loyaltyPoints} pts
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Canjeables en POS</span>
                  </div>
                </div>

                {/* Shortcuts & Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gold-500/15">
                  <button
                    onClick={() => handleToggleStatus(c)}
                    disabled={isBusy}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 ${
                      c.isActive
                        ? 'bg-matte-950 border-amber-600/40 text-amber-400 hover:bg-amber-950/40 hover:border-amber-500'
                        : 'bg-matte-950 border-emerald-600/40 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{c.isActive ? 'Desactivar' : 'Activar'}</span>
                  </button>

                  <button
                    onClick={() => handleCloseCustomer(c)}
                    disabled={isBusy}
                    title={c.isActive ? 'Probar rechazo de cierre condicionado' : 'Cerrar cuenta y recuperar renta'}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-matte-950 border border-red-800/40 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-950/40 hover:border-red-500 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Cerrar Cuenta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
