import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  CreditCard,
  UserCheck,
  Tag,
  Coins,
  Award,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { truncateAddress } from '../utils/constants';

interface PosViewProps {
  onOpenInitModal: () => void;
  onOpenRegisterModal: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  onOpenInitModal,
  onOpenRegisterModal,
}) => {
  const { connected } = useWallet();
  const {
    business,
    customers,
    processSale,
    applyDiscount,
  } = useProgram();

  const [selectedCustomerPda, setSelectedCustomerPda] = useState<string>('');
  const [amountSol, setAmountSol] = useState<string>('0.05');
  const [concept, setConcept] = useState<string>('Venta en Tienda POS');
  const [useDiscount, setUseDiscount] = useState<boolean>(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(10);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const selectedCustomer = customers.find(
    (c) => c.publicKey.toBase58() === selectedCustomerPda
  );

  const quickAmounts = ['0.01', '0.05', '0.10', '0.25', '0.50', '1.00'];

  const discountPerPointSol = 0.0001;
  const numAmountSol = parseFloat(amountSol) || 0;
  const calculatedDiscountSol = useDiscount ? Math.min(numAmountSol, pointsToRedeem * discountPerPointSol) : 0;
  const finalPayAmountSol = Math.max(0, numAmountSol - calculatedDiscountSol);

  const handleProcessTransaction = async () => {
    if (!selectedCustomer) return;
    if (numAmountSol <= 0) return;

    try {
      setSubmitting(true);
      if (useDiscount && pointsToRedeem > 0) {
        await applyDiscount(
          selectedCustomer.publicKey,
          pointsToRedeem,
          numAmountSol,
          calculatedDiscountSol
        );
      } else {
        await processSale(selectedCustomer.publicKey, numAmountSol);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-md mx-auto my-16 p-10 bg-matte-900 border border-gold-500/30 rounded-3xl text-center shadow-gold-md backdrop-blur-xl">
        <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gold-metallic p-0.5 shadow-gold-glow">
          <div className="h-full w-full bg-matte-950 rounded-[22px] flex items-center justify-center">
            <CreditCard className="h-9 w-9 text-gold-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Conecta tu Wallet</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Conecta Phantom o Solflare en <strong className="text-gold-400">Solana Devnet</strong> para acceder a la terminal de cobro.
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-md mx-auto my-16 p-10 bg-matte-900 border border-gold-500/30 rounded-3xl text-center shadow-gold-md backdrop-blur-xl">
        <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gold-metallic p-0.5 shadow-gold-glow">
          <div className="h-full w-full bg-matte-950 rounded-[22px] flex items-center justify-center">
            <Zap className="h-9 w-9 text-gold-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Inicializa tu Negocio</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Tu cuenta de autoridad aún no cuenta con una PDA de Negocio registrada en la blockchain de Solana.
        </p>
        <button
          onClick={onOpenInitModal}
          className="w-full py-4 px-6 rounded-2xl bg-gold-metallic text-matte-950 font-black text-sm uppercase tracking-wider hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          Inicializar Negocio Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Luxury POS Terminal Card */}
      <div className="bg-matte-900 border border-gold-500/30 rounded-[28px] shadow-2xl overflow-hidden backdrop-blur-xl relative">
        {/* Subtle Ambient Gold Backlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Terminal Header */}
        <div className="bg-gradient-to-r from-matte-950 via-matte-900 to-matte-950 p-6 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-2xl bg-matte-950 border border-gold-500/40 flex items-center justify-center shadow-gold-sm">
                <CreditCard className="h-6 w-6 text-gold-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Terminal POS On-Chain</h2>
                <p className="text-xs text-gray-400">Punto de venta y liquidación directa en Solana</p>
              </div>
            </div>
            <div className="text-right bg-matte-950/80 px-3.5 py-2 rounded-xl border border-gold-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Tienda</span>
              <span className="text-xs font-black text-gold-400">{business.name}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 1. Seleccionar Cliente PDA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-gold-400" />
                <span>Cliente PDA</span>
              </label>
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="text-xs text-gold-400 hover:text-gold-300 hover:underline font-bold transition-colors"
              >
                + Registrar Cliente
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="p-4 bg-matte-950 rounded-2xl border border-dashed border-gold-500/30 text-center space-y-3">
                <p className="text-xs text-gray-400">Aún no hay clientes vinculados a este negocio.</p>
                <button
                  onClick={onOpenRegisterModal}
                  className="px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold hover:bg-gold-500/20 hover:scale-105 transition-all duration-200"
                >
                  Registrar Primer Cliente
                </button>
              </div>
            ) : (
              <select
                value={selectedCustomerPda}
                onChange={(e) => {
                  setSelectedCustomerPda(e.target.value);
                  setUseDiscount(false);
                }}
                className="w-full px-4 py-3.5 bg-matte-950 border border-gold-500/30 rounded-2xl text-white text-sm focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200 cursor-pointer"
              >
                <option value="">-- Selecciona un cliente registrado --</option>
                {customers.map((c) => (
                  <option key={c.publicKey.toBase58()} value={c.publicKey.toBase58()} className="bg-matte-900 text-white">
                    {c.name} ({truncateAddress(c.customer.toBase58())}) • {c.loyaltyPoints} pts {c.isActive ? '✓' : '(Inactivo)'}
                  </option>
                ))}
              </select>
            )}

            {/* Customer Status / Loyalty Banner */}
            {selectedCustomer && (
              <div className="mt-2.5 p-3.5 bg-matte-950 rounded-2xl border border-gold-500/25 flex items-center justify-between text-xs shadow-inner-matte">
                <div>
                  <span className="text-gray-400 block text-[11px]">Puntos de Fidelidad:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Award className="h-4 w-4 text-gold-400" />
                    <span className="font-black text-gold-300 text-sm tracking-wide">{selectedCustomer.loyaltyPoints} pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[11px]">Estado PDA:</span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase mt-0.5 ${
                      selectedCustomer.isActive
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                        : 'bg-red-950/80 text-red-400 border border-red-700/60'
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3 inline" />
                    <span>{selectedCustomer.isActive ? 'Activo' : 'Inactivo'}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Entrada de Monto en SOL */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2 flex items-center space-x-2">
              <Coins className="h-4 w-4 text-gold-400" />
              <span>Monto de la Venta (SOL)</span>
            </label>

            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amountSol}
                onChange={(e) => setAmountSol(e.target.value)}
                placeholder="0.00"
                className="w-full pl-5 pr-20 py-4 bg-matte-950 border border-gold-500/30 rounded-2xl text-3xl font-black text-white focus:outline-none focus:border-gold-400 focus:shadow-gold-sm transition-all duration-200 font-mono tracking-wider"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gold-400 bg-gold-950 px-3 py-1 rounded-xl border border-gold-500/40">
                SOL
              </span>
            </div>

            {/* Botones de Montos Rápidos */}
            <div className="grid grid-cols-6 gap-2 mt-2.5">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmountSol(q)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95 ${
                    amountSol === q
                      ? 'bg-gold-metallic text-matte-950 border-gold-400 shadow-gold-sm'
                      : 'bg-matte-950 border-gold-500/20 text-gray-400 hover:text-gold-300 hover:border-gold-500/50 hover:bg-gold-500/5'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Concepto de Venta */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2 flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gold-400" />
              <span>Concepto de Cobro</span>
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Servicio de Consultoría Blockchain"
              className="w-full px-4 py-3 bg-matte-950 border border-gold-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          {/* 4. Módulo de Mejora: Descuento por Puntos (Vibe Coding) */}
          <div className="p-4 bg-matte-950 rounded-2xl border border-gold-500/30 space-y-3.5 shadow-inner-matte">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-lg bg-gold-metallic flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-matte-950" />
                </div>
                <div>
                  <span className="text-xs font-black text-white tracking-wide block">Fidelidad & Puntos (Vibe Coding)</span>
                  <span className="text-[10px] text-gray-400">Canje de puntos on-chain por descuento</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDiscount}
                  onChange={(e) => setUseDiscount(e.target.checked)}
                  disabled={!selectedCustomer || selectedCustomer.loyaltyPoints <= 0}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-matte-800 border border-gold-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-matte-950 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-400 peer-checked:after:bg-matte-950 after:border-gray-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-metallic peer-checked:border-gold-400 shadow-gold-sm"></div>
              </label>
            </div>

            {useDiscount && selectedCustomer && (
              <div className="pt-3 border-t border-gold-500/20 space-y-3 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="font-semibold">Puntos a canjear:</span>
                  <span className="font-black text-gold-400 text-sm font-mono">{pointsToRedeem} pts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(1, selectedCustomer.loyaltyPoints)}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                  className="w-full accent-gold-400 cursor-pointer"
                />
                <div className="flex items-center justify-between bg-gold-950/40 p-3 rounded-xl border border-gold-500/30 text-xs shadow-gold-sm">
                  <span className="text-gray-300 font-medium">Ahorro en Descuento:</span>
                  <span className="font-black text-gold-300 font-mono text-sm">-{calculatedDiscountSol.toFixed(4)} SOL</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen Total Recibo */}
          <div className="p-4 bg-matte-950 rounded-2xl border border-gold-500/25 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Subtotal:</span>
              <span className="font-mono">{numAmountSol.toFixed(4)} SOL</span>
            </div>
            {useDiscount && calculatedDiscountSol > 0 && (
              <div className="flex items-center justify-between text-xs text-gold-400 font-semibold">
                <span>Descuento Canje Puntos:</span>
                <span className="font-mono">-{calculatedDiscountSol.toFixed(4)} SOL</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2.5 border-t border-gold-500/20 text-base font-black text-white">
              <span>Total a Liquidar:</span>
              <span className="text-2xl text-gold-400 font-mono tracking-wide">{finalPayAmountSol.toFixed(4)} SOL</span>
            </div>
          </div>

          {/* Botón de Firma con Efecto Hover Dorado Intenso */}
          <button
            type="button"
            disabled={submitting || !selectedCustomer || numAmountSol <= 0 || !selectedCustomer.isActive}
            onClick={handleProcessTransaction}
            className="w-full py-4 px-6 rounded-2xl bg-gold-metallic text-matte-950 font-black text-sm uppercase tracking-wider hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            {submitting ? (
              <span>Firmando en Wallet Adapter...</span>
            ) : !selectedCustomer ? (
              <span>Selecciona un Cliente para Continuar</span>
            ) : !selectedCustomer.isActive ? (
              <span>Cliente Inactivo (Operación Bloqueada)</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-matte-950" />
                <span>Firmar Cobro de {finalPayAmountSol.toFixed(4)} SOL</span>
                <ArrowRight className="h-4 w-4 text-matte-950" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
