import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Store, ShoppingCart, Users, LayoutDashboard, RefreshCw, Sparkles } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

interface NavbarProps {
  currentView: 'pos' | 'customers' | 'admin';
  setCurrentView: (view: 'pos' | 'customers' | 'admin') => void;
  onOpenInitModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenInitModal,
}) => {
  const { business, refreshing, fetchData } = useProgram();

  return (
    <header className="bg-matte-900/90 border-b border-gold-500/20 sticky top-0 z-40 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gold-metallic p-0.5 shadow-gold-md hover:shadow-gold-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="h-full w-full bg-matte-950 rounded-[14px] flex items-center justify-center">
                <Store className="h-5 w-5 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-xl text-white tracking-tight bg-gradient-to-r from-white via-gray-100 to-gold-300 bg-clip-text text-transparent">
                  Solana POS
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-gold-950 text-gold-400 border border-gold-500/30 px-2.5 py-0.5 rounded-full shadow-gold-sm">
                  Devnet
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {business ? (
                  <span className="text-gray-300 flex items-center space-x-1">
                    <span className="text-gray-400">Tienda:</span>
                    <strong className="text-gold-400 font-bold tracking-wide">{business.name}</strong>
                  </span>
                ) : (
                  <button
                    onClick={onOpenInitModal}
                    className="text-xs text-gold-400 hover:text-gold-300 hover:underline font-bold flex items-center space-x-1 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 inline" />
                    <span>Inicializar Negocio On-Chain</span>
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-matte-950/80 p-1.5 rounded-2xl border border-gold-500/20 shadow-inner-matte">
            <button
              onClick={() => setCurrentView('pos')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                currentView === 'pos'
                  ? 'bg-gold-metallic text-matte-950 shadow-gold-md scale-[1.02]'
                  : 'text-gray-400 hover:text-gold-300 hover:bg-matte-850 hover:border-gold-500/30'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Terminal POS</span>
            </button>
            <button
              onClick={() => setCurrentView('customers')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                currentView === 'customers'
                  ? 'bg-gold-metallic text-matte-950 shadow-gold-md scale-[1.02]'
                  : 'text-gray-400 hover:text-gold-300 hover:bg-matte-850 hover:border-gold-500/30'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Expedientes</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                currentView === 'admin'
                  ? 'bg-gold-metallic text-matte-950 shadow-gold-md scale-[1.02]'
                  : 'text-gray-400 hover:text-gold-300 hover:bg-matte-850 hover:border-gold-500/30'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard & Inspector</span>
            </button>
          </nav>

          {/* Right Side: Refresh & Wallet Adapter Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              title="Refrescar estado on-chain"
              className="p-2.5 rounded-xl bg-matte-950 border border-gold-500/25 text-gray-400 hover:text-gold-400 hover:border-gold-500/60 hover:shadow-gold-sm transition-all duration-300 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-gold-400' : ''}`} />
            </button>
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-t border-gold-500/15 bg-matte-950 px-2 py-2 justify-around">
        <button
          onClick={() => setCurrentView('pos')}
          className={`flex flex-col items-center py-2 px-4 rounded-xl text-[11px] font-bold uppercase transition-all duration-200 ${
            currentView === 'pos'
              ? 'text-gold-400 bg-gold-500/10 border border-gold-500/30 shadow-gold-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShoppingCart className="h-4 w-4 mb-1" />
          <span>POS</span>
        </button>
        <button
          onClick={() => setCurrentView('customers')}
          className={`flex flex-col items-center py-2 px-4 rounded-xl text-[11px] font-bold uppercase transition-all duration-200 ${
            currentView === 'customers'
              ? 'text-gold-400 bg-gold-500/10 border border-gold-500/30 shadow-gold-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="h-4 w-4 mb-1" />
          <span>Clientes</span>
        </button>
        <button
          onClick={() => setCurrentView('admin')}
          className={`flex flex-col items-center py-2 px-4 rounded-xl text-[11px] font-bold uppercase transition-all duration-200 ${
            currentView === 'admin'
              ? 'text-gold-400 bg-gold-500/10 border border-gold-500/30 shadow-gold-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 mb-1" />
          <span>Dashboard</span>
        </button>
      </div>
    </header>
  );
};
