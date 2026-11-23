import React, { useState } from 'react';
import { WalletContextProvider } from './context/WalletContext';
import { ProgramProvider, useProgram } from './context/ProgramContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { PosView } from './components/PosView';
import { CustomerExpedientView } from './components/CustomerExpedientView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { InitBusinessModal } from './components/InitBusinessModal';
import { RegisterCustomerModal } from './components/RegisterCustomerModal';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'pos' | 'customers' | 'admin'>('pos');
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { loading } = useProgram();

  return (
    <div className="min-h-screen flex flex-col bg-matte-950 text-gray-100 selection:bg-gold-500 selection:text-matte-950">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenInitModal={() => setIsInitModalOpen(true)}
      />

      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="h-14 w-14 rounded-full border-4 border-matte-800 border-t-gold-400 animate-spin shadow-gold-glow"></div>
            <p className="text-xs uppercase tracking-widest text-gold-400/80 font-bold">Conectando a Solana Devnet...</p>
          </div>
        ) : (
          <>
            {currentView === 'pos' && (
              <PosView
                onOpenInitModal={() => setIsInitModalOpen(true)}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              />
            )}
            {currentView === 'customers' && (
              <CustomerExpedientView
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              />
            )}
            {currentView === 'admin' && <AdminDashboardView />}
          </>
        )}
      </main>

      <footer className="border-t border-gold-500/15 py-8 px-4 bg-matte-900/60 text-center text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-400">
          Solana Engineering Track: Advanced Bootcamp — Proyecto Final
        </p>
        <p className="text-[11px] text-gray-600">
          Arquitectura en Rust + Anchor Framework + Codama + React + Tailwind CSS en Solana Devnet
        </p>
      </footer>

      {/* Modals & Toasts */}
      <InitBusinessModal
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
      />
      <RegisterCustomerModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <WalletContextProvider>
      <ProgramProvider>
        <MainContent />
      </ProgramProvider>
    </WalletContextProvider>
  );
}
