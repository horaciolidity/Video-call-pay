import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Transaction, WithdrawalRequest } from '../types';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'recharge' | 'withdraw' | 'history'>('recharge');
  
  // Recharge form state
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto' | 'mercadopago'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('Martín Almada');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank_transfer' | 'crypto_usdt' | 'paypal'>('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Ledger history state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getWalletSummary();
      setTransactions(res.transactions);
      setWithdrawals(res.withdrawals);
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rechargeAmount < 5) {
      setErrorMsg('El importe mínimo de recarga es de $5.00 USD');
      return;
    }
    setErrorMsg(null);
    setIsProcessingPayment(true);

    try {
      const res = await api.rechargeWallet(
        rechargeAmount,
        paymentMethod === 'card' ? 'Tarjeta Visa' : paymentMethod.toUpperCase(),
        'AUTH_' + Math.floor(100000 + Math.random() * 900000)
      );
      setPaymentSuccessMsg(`¡Recarga exitosa! Se acreditaron $${rechargeAmount.toFixed(2)} USD en tu cuenta.`);
      await refreshUser();
      loadWalletData();
      setTimeout(() => setPaymentSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el pago.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails.trim()) {
      setErrorMsg('Por favor especifica los datos de destino del cobro.');
      return;
    }
    setErrorMsg(null);
    setIsProcessingWithdraw(true);

    try {
      await api.requestWithdrawal(withdrawAmount, withdrawMethod, accountDetails);
      setWithdrawSuccessMsg(`Solicitud de retiro por $${withdrawAmount.toFixed(2)} USD enviada a SuperAdmin.`);
      await refreshUser();
      loadWalletData();
      setTimeout(() => setWithdrawSuccessMsg(null), 4000);
      setAccountDetails('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar el retiro.');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const isProviderOrAdmin = user?.role === 'prestador' || user?.role === 'superadmin' || user?.role === 'administrador';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col my-auto overflow-hidden">
        
        {/* Header with Balance Card */}
        <div className="p-6 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border-b border-slate-800/80 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Billetera Digital Integrada
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-2">
                <span>${user?.walletBalance.toFixed(2) || '0.00'}</span>
                <span className="text-xs font-medium text-emerald-400">USD Disponibles</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('recharge');
                setErrorMsg(null);
              }}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'recharge'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              + Recargar Saldo
            </button>

            {isProviderOrAdmin && (
              <button
                onClick={() => {
                  setActiveTab('withdraw');
                  setErrorMsg(null);
                }}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'withdraw'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Solicitar Retiro
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('history');
                setErrorMsg(null);
              }}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Movimientos & Facturación
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. RECHARGE TAB */}
          {activeTab === 'recharge' && (
            <form onSubmit={handleRecharge} className="space-y-4">
              {paymentSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Selecciona o escribe el importe a recargar (USD)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        rechargeAmount === amt
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ${amt} USD
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="5"
                    max="2000"
                    step="1"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'card', label: 'Tarjeta Déb/Créd', icon: CreditCard },
                    { id: 'paypal', label: 'PayPal', icon: Wallet },
                    { id: 'crypto', label: 'USDT (TRC20)', icon: Sparkles },
                    { id: 'mercadopago', label: 'MercadoPago', icon: Send },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === m.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1 text-slate-300" />
                        <div className="text-[11px] font-semibold">{m.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Inputs Mock */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300">Detalles de Facturación</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Servidor Seguro SSL 256-bit
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Titular de la cuenta</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">CVC</label>
                    <input
                      type="text"
                      defaultValue="888"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isProcessingPayment ? (
                  <span>Verificando pasarela de pago...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Acreditar ${rechargeAmount.toFixed(2)} USD Inmediatamente</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. WITHDRAW TAB */}
          {activeTab === 'withdraw' && isProviderOrAdmin && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {withdrawSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Importe mínimo de retiro: <strong>$20.00 USD</strong>. Los fondos se deducen de tu billetera y son liquidados por SuperAdmin.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Importe a Retirar (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="20"
                    max={user?.walletBalance || 0}
                    step="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Método de Destino
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium"
                >
                  <option value="bank_transfer">Transferencia Bancaria (CBU / IBAN / ACH)</option>
                  <option value="crypto_usdt">Cripto USDT (Red TRC20 / Polygon)</option>
                  <option value="paypal">Cuenta PayPal (Correo electrónico)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Datos de la Cuenta de Destino
                </label>
                <textarea
                  rows={3}
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="Ej: CBU/IBAN: 00000031000... Titular: Sofía Valenzuela, o Dirección USDT TRC20: TLAy2Qj9..."
                  className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessingWithdraw || (user?.walletBalance || 0) < withdrawAmount}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isProcessingWithdraw ? (
                  <span>Registrando solicitud...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud de Retiro (${withdrawAmount.toFixed(2)} USD)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-xs text-slate-400">Cargando movimientos...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No hay movimientos registrados en esta cuenta todavía.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isPositive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{tx.description}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(tx.createdAt).toLocaleDateString([], {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono font-bold ${
                              isPositive ? 'text-emerald-400' : 'text-slate-300'
                            }`}
                          >
                            {isPositive ? '+' : ''}${tx.amount.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Saldo: ${tx.balanceAfter.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
