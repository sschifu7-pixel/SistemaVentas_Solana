import React, { useState } from 'react';
import {
  LayoutDashboard,
  Coins,
  ShoppingCart,
  Users,
  Award,
  Database,
  ExternalLink,
  Code2,
  FileJson,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { formatSol, truncateAddress, PROGRAM_ID } from '../utils/constants';

export const AdminDashboardView: React.FC = () => {
  const { business, customers, transactions, businessPda } = useProgram();
  const [activeInspectorTab, setActiveInspectorTab] = useState<'visual' | 'json'>('visual');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const activeCustomersCount = customers.filter((c) => c.isActive).length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center space-x-2.5 tracking-tight">
          <LayoutDashboard className="h-7 w-7 text-gold-400" />
          <span>Dashboard de Administración & Métricas</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Supervisión de métricas de red, inspector de cuentas PDA deserializadas y feed on-chain
        </p>
      </div>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-matte-900 border border-gold-500/25 hover:border-gold-400/60 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px]">Ventas Totales</span>
            <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-gold-400" />
            </div>
          </div>
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {business?.totalSales ?? 0}
          </span>
          <span className="text-[11px] text-gray-400 block mt-2 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-gold-400" />
            <span>Transacciones registradas</span>
          </span>
          <div className="absolute -bottom-8 -right-8 h-20 w-20 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Metric 2 */}
        <div className="bg-matte-900 border border-gold-500/25 hover:border-gold-400/60 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px]">Volumen Facturado</span>
            <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center">
              <Coins className="h-4 w-4 text-gold-400" />
            </div>
          </div>
          <span className="text-4xl font-black text-gold-400 font-mono tracking-tight">
            {business ? formatSol(business.totalVolume) : '0.0000'}
            <span className="text-sm ml-1.5 font-sans text-gray-400 font-normal">SOL</span>
          </span>
          <span className="text-[11px] text-gray-400 block mt-2">Facturación on-chain</span>
          <div className="absolute -bottom-8 -right-8 h-20 w-20 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Metric 3 */}
        <div className="bg-matte-900 border border-gold-500/25 hover:border-gold-400/60 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px]">Clientes Registrados</span>
            <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center">
              <Users className="h-4 w-4 text-gold-400" />
            </div>
          </div>
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {customers.length}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-2 font-bold">
            {activeCustomersCount} activos / {customers.length - activeCustomersCount} inactivos
          </span>
          <div className="absolute -bottom-8 -right-8 h-20 w-20 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Metric 4 */}
        <div className="bg-matte-900 border border-gold-500/25 hover:border-gold-400/60 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px]">Puntos Emitidos</span>
            <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center">
              <Award className="h-4 w-4 text-gold-400" />
            </div>
          </div>
          <span className="text-4xl font-black text-gold-400 font-mono tracking-tight">
            {totalLoyaltyPoints}
            <span className="text-sm ml-1.5 font-sans text-gray-400 font-normal">pts</span>
          </span>
          <span className="text-[11px] text-gray-400 block mt-2">Puntos circulantes (Fidelidad)</span>
          <div className="absolute -bottom-8 -right-8 h-20 w-20 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* PDA Account Inspector Section */}
      <div className="bg-matte-900 border border-gold-500/25 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center shadow-gold-sm">
              <Database className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Inspector de Cuentas PDA (Anchor IDL)</h3>
              <p className="text-xs text-gray-400">
                Estructuras deserializadas directamente desde la blockchain de Solana
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-matte-950 p-1.5 rounded-2xl border border-gold-500/20 shadow-inner-matte">
            <button
              onClick={() => setActiveInspectorTab('visual')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeInspectorTab === 'visual'
                  ? 'bg-gold-metallic text-matte-950 shadow-gold-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Vista Visual</span>
            </button>
            <button
              onClick={() => setActiveInspectorTab('json')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeInspectorTab === 'json'
                  ? 'bg-gold-metallic text-matte-950 shadow-gold-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>JSON Crudo</span>
            </button>
          </div>
        </div>

        {activeInspectorTab === 'visual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business PDA Inspector Card */}
            <div className="bg-matte-950 border border-gold-500/25 rounded-2xl p-5 space-y-3.5 shadow-inner-matte">
              <div className="flex items-center justify-between border-b border-gold-500/20 pb-2.5">
                <span className="text-xs font-black text-gold-400 uppercase tracking-wider">Cuenta PDA de Negocio (Business)</span>
                <span className="text-[10px] bg-gold-950 text-gold-300 border border-gold-500/40 px-2.5 py-0.5 rounded-full font-mono">
                  [b"business", authority]
                </span>
              </div>

              {business && businessPda ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px] font-bold uppercase">PDA Address:</span>
                    <code className="text-gold-300 font-mono break-all text-[11px] block mt-0.5">
                      {businessPda.toBase58()}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] font-bold uppercase">Autoridad (Owner):</span>
                    <code className="text-gray-300 font-mono break-all text-[11px] block mt-0.5">
                      {business.authority.toBase58()}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-gold-500/15">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Nombre:</span>
                      <strong className="text-white text-sm">{business.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Bump Seed:</span>
                      <strong className="text-gold-400 font-mono">{business.bump}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Total Ventas:</span>
                      <strong className="text-white font-mono text-sm">{business.totalSales}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Volumen (Lamports):</span>
                      <strong className="text-gold-400 font-mono text-sm">{business.totalVolume}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">Negocio no inicializado aún.</p>
              )}
            </div>

            {/* Customers PDA Inspector Card */}
            <div className="bg-matte-950 border border-gold-500/25 rounded-2xl p-5 space-y-3.5 shadow-inner-matte">
              <div className="flex items-center justify-between border-b border-gold-500/20 pb-2.5">
                <span className="text-xs font-black text-gold-400 uppercase tracking-wider">Cuentas PDA de Clientes ({customers.length})</span>
                <span className="text-[10px] bg-gold-950 text-gold-300 border border-gold-500/40 px-2.5 py-0.5 rounded-full font-mono">
                  [b"customer", business, wallet]
                </span>
              </div>

              {customers.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No hay clientes registrados en esta sesión.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {customers.map((c) => (
                    <div
                      key={c.publicKey.toBase58()}
                      className="p-3 bg-matte-900 border border-gold-500/20 rounded-xl text-xs space-y-1 hover:border-gold-400/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-white font-bold">{c.name}</strong>
                        <span className="text-[10px] text-gold-400 font-mono">
                          Bump: {c.bump}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono truncate">
                        PDA: <span className="text-gold-300">{c.publicKey.toBase58()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-300 pt-1">
                        <span>Puntos: <strong className="text-gold-400 font-mono">{c.loyaltyPoints}</strong></span>
                        <span>Compras: <strong className="text-white font-mono">{c.purchasesCount}</strong></span>
                        <span>Volumen: <strong className="text-gold-300 font-mono">{formatSol(c.totalPurchases)} SOL</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-matte-950 rounded-2xl border border-gold-500/25 overflow-x-auto shadow-inner-matte">
            <pre className="text-xs font-mono text-gold-300 leading-relaxed">
              {JSON.stringify(
                {
                  programId: PROGRAM_ID.toBase58(),
                  businessPda: businessPda?.toBase58(),
                  businessAccount: business
                    ? {
                        authority: business.authority.toBase58(),
                        name: business.name,
                        totalSales: business.totalSales,
                        totalVolumeLamports: business.totalVolume,
                        bump: business.bump,
                      }
                    : null,
                  customersCount: customers.length,
                  customerAccounts: customers.map((c) => ({
                    pda: c.publicKey.toBase58(),
                    wallet: c.customer.toBase58(),
                    name: c.name,
                    purchasesCount: c.purchasesCount,
                    totalPurchasesLamports: c.totalPurchases,
                    loyaltyPoints: c.loyaltyPoints,
                    isActive: c.isActive,
                    bump: c.bump,
                  })),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Live Transaction Feed Table */}
      <div className="bg-matte-900 border border-gold-500/25 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Feed de Transacciones en Tiempo Real</h3>
            <p className="text-xs text-gray-400">Registradas durante esta sesión en Solana Devnet</p>
          </div>
          <span className="text-xs font-mono text-gold-400 bg-gold-950 px-3 py-1 rounded-xl border border-gold-500/30">
            {transactions.length} registros
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-xs">
            Aún no se han enviado transacciones desde esta interfaz.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gold-500/20">
            <table className="w-full text-left text-xs">
              <thead className="bg-matte-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gold-500/20">
                <tr>
                  <th className="py-3.5 px-4">Operación</th>
                  <th className="py-3.5 px-4">Detalle</th>
                  <th className="py-3.5 px-4">Monto / Puntos</th>
                  <th className="py-3.5 px-4">Hora</th>
                  <th className="py-3.5 px-4">Tx Signature</th>
                  <th className="py-3.5 px-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10 bg-matte-900">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-matte-850/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          tx.type === 'SALE'
                            ? 'bg-gold-950 text-gold-400 border border-gold-500/40 shadow-sm'
                            : tx.type === 'DISCOUNT_SALE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : tx.type === 'REGISTER_CUSTOMER'
                            ? 'bg-blue-950 text-blue-300 border border-blue-600/40'
                            : tx.type === 'CLOSE_CUSTOMER'
                            ? 'bg-red-950 text-red-400 border border-red-700/40'
                            : 'bg-matte-800 text-gray-300 border border-matte-700'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-medium">{tx.description}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      {tx.amount !== undefined ? (
                        <span className="text-gold-400 font-bold">{tx.amount.toFixed(4)} SOL</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-400">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-gray-300">{truncateAddress(tx.signature, 5)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.signature, tx.id)}
                          className="text-gray-500 hover:text-gold-400 transition-colors"
                        >
                          {copiedKey === tx.id ? (
                            <Check className="h-3.5 w-3.5 text-gold-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-gold-400 hover:text-gold-300 hover:underline font-bold transition-colors"
                      >
                        <span>Explorar</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
