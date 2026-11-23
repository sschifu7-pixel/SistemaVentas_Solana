import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, TransactionSignature } from '@solana/web3.js';
import { AnchorProvider, Program, BN, Idl } from '@coral-xyz/anchor';
import posSolanaIdl from '../idl/pos_solana.json';
import { BusinessAccount, CustomerAccount, TransactionRecord, ToastMessage } from '../types';
import { PROGRAM_ID, getBusinessPda, getCustomerPda, LAMPORTS_PER_SOL } from '../utils/constants';

interface ProgramContextState {
  business: BusinessAccount | null;
  customers: CustomerAccount[];
  loading: boolean;
  refreshing: boolean;
  businessPda: PublicKey | null;
  transactions: TransactionRecord[];
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  fetchData: () => Promise<void>;
  initializeBusiness: (name: string) => Promise<TransactionSignature>;
  registerCustomer: (name: string, customerWallet: PublicKey) => Promise<TransactionSignature>;
  processSale: (customerPda: PublicKey, amountSol: number) => Promise<TransactionSignature>;
  applyDiscount: (
    customerPda: PublicKey,
    pointsToRedeem: number,
    saleAmountSol: number,
    discountSol: number
  ) => Promise<TransactionSignature>;
  setCustomerStatus: (customerPda: PublicKey, isActive: boolean) => Promise<TransactionSignature>;
  closeCustomer: (customerPda: PublicKey) => Promise<TransactionSignature>;
}

const ProgramContext = createContext<ProgramContextState>({} as ProgramContextState);

export const ProgramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pos_solana_txs');
      if (saved) {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
      }
    } catch {}
    return [];
  });

  const saveTransactions = (newTxs: TransactionRecord[]) => {
    setTransactions(newTxs);
    try {
      localStorage.setItem('pos_solana_txs', JSON.stringify(newTxs));
    } catch {}
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 7000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Business PDA derived from connected wallet
  const businessPda = useMemo(() => {
    if (!wallet.publicKey) return null;
    return getBusinessPda(wallet.publicKey)[0];
  }, [wallet.publicKey]);

  // Read-only or write provider
  const program = useMemo(() => {
    // If wallet connected, use wallet as provider; otherwise use read-only dummy wallet
    const provider = new AnchorProvider(
      connection,
      wallet.publicKey ? (wallet as any) : {
        publicKey: PublicKey.default,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      },
      { commitment: 'confirmed' }
    );
    return new Program(posSolanaIdl as unknown as Idl, provider);
  }, [connection, wallet]);

  // Fetch business and customers accounts directly via RPC without requiring signatures
  const fetchData = async () => {
    if (!wallet.publicKey || !businessPda) {
      setBusiness(null);
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      // Fetch Business Account
      try {
        const bAcc = await (program.account as any).business.fetch(businessPda);
        setBusiness({
          publicKey: businessPda,
          authority: bAcc.authority,
          name: bAcc.name,
          totalSales: bAcc.totalSales ? bAcc.totalSales.toNumber() : 0,
          totalVolume: bAcc.totalVolume ? bAcc.totalVolume.toNumber() : 0,
          bump: bAcc.bump,
        });
      } catch (e: any) {
        // Business not initialized yet
        setBusiness(null);
      }

      // Fetch all Customers associated with this program
      try {
        const allCustomerAccounts = await (program.account as any).customer.all([
          {
            memcmp: {
              offset: 8, // after discriminator
              bytes: businessPda.toBase58(),
            },
          },
        ]);

        const parsedCustomers: CustomerAccount[] = allCustomerAccounts.map((item: any) => ({
          publicKey: item.publicKey,
          business: item.account.business,
          customer: item.account.customer,
          name: item.account.name,
          totalPurchases: item.account.totalPurchases ? item.account.totalPurchases.toNumber() : 0,
          purchasesCount: item.account.purchasesCount ? item.account.purchasesCount.toNumber() : 0,
          loyaltyPoints: item.account.loyaltyPoints ? item.account.loyaltyPoints.toNumber() : 0,
          isActive: item.account.isActive ?? true,
          bump: item.account.bump,
        }));

        setCustomers(parsedCustomers);
      } catch (e) {
        console.error('Error fetching customers:', e);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wallet.publicKey, businessPda, connection]);

  // Helper to record transaction
  const recordTx = (
    sig: string,
    type: TransactionRecord['type'],
    title: string,
    description: string,
    amount?: number,
    points?: number
  ) => {
    const newTx: TransactionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      signature: sig,
      type,
      title,
      description,
      amount,
      points,
      timestamp: new Date(),
      status: 'confirmed',
    };
    saveTransactions([newTx, ...transactions]);
  };

  // 1. initialize_business
  const initializeBusiness = async (name: string): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    try {
      const tx = await (program.methods as any)
        .initializeBusiness(name)
        .accounts({
          business: businessPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      recordTx(
        tx,
        'INITIALIZE',
        'Negocio Inicializado',
        `Negocio "${name}" configurado con éxito.`,
        undefined,
        undefined
      );

      addToast({
        type: 'success',
        title: '¡Negocio Inicializado!',
        message: `El negocio "${name}" fue registrado en Solana Devnet.`,
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error al inicializar negocio',
        message: err.message || 'La transacción fue rechazada.',
      });
      throw err;
    }
  };

  // 2. register_customer
  const registerCustomer = async (
    name: string,
    customerWallet: PublicKey
  ): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    const [customerPda] = getCustomerPda(businessPda, customerWallet);

    try {
      const tx = await (program.methods as any)
        .registerCustomer(name)
        .accounts({
          business: businessPda,
          customer: customerPda,
          customerWallet: customerWallet,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      recordTx(
        tx,
        'REGISTER_CUSTOMER',
        'Cliente Registrado',
        `Cliente "${name}" (${customerWallet.toBase58().slice(0, 6)}...) dado de alta.`,
        undefined,
        undefined
      );

      addToast({
        type: 'success',
        title: '¡Cliente Registrado!',
        message: `Cliente "${name}" vinculado a la PDA del negocio.`,
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error al registrar cliente',
        message: err.message || 'La transacción falló.',
      });
      throw err;
    }
  };

  // 3. process_sale
  const processSale = async (
    customerPda: PublicKey,
    amountSol: number
  ): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    const lamports = new BN(Math.round(amountSol * LAMPORTS_PER_SOL));
    const pointsExpected = Math.max(1, Math.floor((amountSol * LAMPORTS_PER_SOL) / 100_000));

    try {
      const tx = await (program.methods as any)
        .processSale(lamports)
        .accounts({
          business: businessPda,
          customer: customerPda,
          authority: wallet.publicKey,
        })
        .rpc();

      recordTx(
        tx,
        'SALE',
        'Venta Procesada',
        `Cobro de ${amountSol} SOL registrado exitosamente.`,
        amountSol,
        pointsExpected
      );

      addToast({
        type: 'success',
        title: '¡Venta Registrada Exitosamente!',
        message: `Monto: ${amountSol} SOL (+${pointsExpected} puntos fidelidad)`,
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      let msg = err.message || 'Error al procesar la venta';
      if (msg.includes('CustomerInactive')) {
        msg = 'El cliente se encuentra inactivo y no puede realizar compras.';
      }
      addToast({
        type: 'error',
        title: 'Error en Punto de Venta',
        message: msg,
      });
      throw err;
    }
  };

  // 4. apply_discount (Vibe Coding Improvement)
  const applyDiscount = async (
    customerPda: PublicKey,
    pointsToRedeem: number,
    saleAmountSol: number,
    discountSol: number
  ): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    const pts = new BN(pointsToRedeem);
    const saleLamports = new BN(Math.round(saleAmountSol * LAMPORTS_PER_SOL));
    const discountLamports = new BN(Math.round(discountSol * LAMPORTS_PER_SOL));
    const finalAmountSol = saleAmountSol - discountSol;

    try {
      const tx = await (program.methods as any)
        .applyDiscount(pts, saleLamports, discountLamports)
        .accounts({
          business: businessPda,
          customer: customerPda,
          authority: wallet.publicKey,
        })
        .rpc();

      recordTx(
        tx,
        'DISCOUNT_SALE',
        'Venta con Descuento Fidelidad',
        `Canjeados ${pointsToRedeem} puntos. Venta final: ${finalAmountSol.toFixed(4)} SOL.`,
        finalAmountSol,
        -pointsToRedeem
      );

      addToast({
        type: 'success',
        title: '¡Descuento Aplicado Exitosamente!',
        message: `Se canjearon ${pointsToRedeem} puntos por un ahorro de ${discountSol} SOL.`,
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      let msg = err.message || 'Error al aplicar descuento';
      if (msg.includes('InsufficientLoyaltyPoints')) {
        msg = 'Puntos de fidelidad insuficientes para aplicar este descuento.';
      } else if (msg.includes('CustomerInactive')) {
        msg = 'El cliente está inactivo.';
      }
      addToast({
        type: 'error',
        title: 'Error de Descuento (Rechazo Controlado)',
        message: msg,
      });
      throw err;
    }
  };

  // 5. set_customer_status
  const setCustomerStatus = async (
    customerPda: PublicKey,
    isActive: boolean
  ): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    try {
      const tx = await (program.methods as any)
        .setCustomerStatus(isActive)
        .accounts({
          business: businessPda,
          customer: customerPda,
          authority: wallet.publicKey,
        })
        .rpc();

      recordTx(
        tx,
        'STATUS_CHANGE',
        `Cliente ${isActive ? 'Activado' : 'Desactivado'}`,
        `Estado del cliente actualizado a: ${isActive ? 'Activo' : 'Inactivo'}.`,
        undefined,
        undefined
      );

      addToast({
        type: 'success',
        title: `Cliente ${isActive ? 'Activado' : 'Desactivado'}`,
        message: `El estado del cliente fue actualizado en la blockchain.`,
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error al cambiar estado',
        message: err.message || 'Falló la actualización.',
      });
      throw err;
    }
  };

  // 6. close_customer (Baja / Cierre del Día 5)
  const closeCustomer = async (customerPda: PublicKey): Promise<TransactionSignature> => {
    if (!wallet.publicKey || !businessPda) throw new Error('Wallet no conectada');

    try {
      const tx = await (program.methods as any)
        .closeCustomer()
        .accounts({
          business: businessPda,
          customer: customerPda,
          authority: wallet.publicKey,
        })
        .rpc();

      recordTx(
        tx,
        'CLOSE_CUSTOMER',
        'Cuenta de Cliente Cerrada (Baja)',
        'Cuenta PDA eliminada y fondos de renta retornados a la autoridad.',
        undefined,
        undefined
      );

      addToast({
        type: 'success',
        title: '¡Cuenta Cerrada Exitosamente!',
        message: 'La cuenta PDA fue cerrada y la renta fue devuelta a tu wallet.',
        txSignature: tx,
      });

      await fetchData();
      return tx;
    } catch (err: any) {
      let msg = err.message || 'Error al cerrar cuenta';
      if (msg.includes('CustomerStillActive')) {
        msg = 'No se puede cerrar la cuenta de un cliente activo. Debe darse de baja primero.';
      }
      addToast({
        type: 'error',
        title: 'Rechazo al Cerrar Cuenta',
        message: msg,
      });
      throw err;
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        business,
        customers,
        loading,
        refreshing,
        businessPda,
        transactions,
        toasts,
        addToast,
        removeToast,
        fetchData,
        initializeBusiness,
        registerCustomer,
        processSale,
        applyDiscount,
        setCustomerStatus,
        closeCustomer,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);

