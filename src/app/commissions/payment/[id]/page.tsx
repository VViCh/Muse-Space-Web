"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

type PaymentState = 'checkout' | 'loading' | 'instruction' | 'success' | 'failure';

export default function PaymentPage() {
  const params = useParams();
  const orderId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string>('virtual_account');
  const [paymentState, setPaymentState] = useState<PaymentState>('checkout');

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setErrorMsg('');
      const res = await api.get(`/commissions/${orderId}`);
      if (res.data?.isSuccess) {
        setOrderDetails({
          id: res.data.data.id,
          artist: res.data.data.artistUsername,
          service: res.data.data.title,
          basePrice: res.data.data.price,
          addons: [],
          total: res.data.data.price
        });
      } else {
        setErrorMsg(res.data?.message || 'Failed to load commission details.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred while fetching payment details.');
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentState === 'loading') {
      timer = setTimeout(() => {
        setPaymentState('instruction');
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [paymentState]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentState('loading');
    try {
      const res = await api.get(`/payments/${orderId}/qr`);
      if (res.data?.isSuccess) {
        setQrCodeUrl(res.data.data);
      }
    } catch (err) {
      console.error("Failed to generate QR or transition state", err);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const res = await api.post(`/payments/${orderId}/confirm`);
      if (res.data?.isSuccess) {
        setPaymentState('success');
      } else {
        setPaymentState('failure');
      }
    } catch (err) {
      setPaymentState('failure');
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#060913] p-4 text-center">
        {errorMsg ? (
          <div className="bg-white/80 dark:bg-slate-900/40 p-8 rounded-3xl border border-red-500/20 shadow-xl max-w-md w-full">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Payment</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{errorMsg}</p>
            <button 
              onClick={fetchOrder}
              className="w-full py-3 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading payment details...</p>
            <p className="text-xs text-slate-400 mt-2">Order ID: {orderId || 'undefined'}</p>
            <p className="text-[10px] text-slate-400/50 mt-1">Params: {JSON.stringify(params)}</p>
          </div>
        )}
      </div>
    );
  }

  const renderCheckout = () => (
    <div className="bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col relative h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">lock</span>
          Secure Checkout
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Select a payment method to complete your transaction.</p>
      </div>

      <form onSubmit={handlePayment} className="flex-1 flex flex-col">
        <div className="space-y-4 mb-8">
          <label className={`relative flex cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
            selectedMethod === 'credit_card' 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
          }`}>
            <input type="radio" name="payment" value="credit_card" className="sr-only" checked={selectedMethod === 'credit_card'} onChange={(e) => setSelectedMethod(e.target.value)} />
            <div className="flex items-center gap-4 w-full">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selectedMethod === 'credit_card' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selectedMethod === 'credit_card' && <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
              </div>
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-3xl">credit_card</span>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white font-bold tracking-wide">Credit Card</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Visa, Mastercard, AMEX</p>
              </div>
            </div>
          </label>

          <label className={`relative flex cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
            selectedMethod === 'ewallet' 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
          }`}>
            <input type="radio" name="payment" value="ewallet" className="sr-only" checked={selectedMethod === 'ewallet'} onChange={(e) => setSelectedMethod(e.target.value)} />
            <div className="flex items-center gap-4 w-full">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selectedMethod === 'ewallet' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selectedMethod === 'ewallet' && <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
              </div>
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-3xl">account_balance_wallet</span>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white font-bold tracking-wide">e-Wallet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">PayPal, Apple Pay, Google Pay</p>
              </div>
            </div>
          </label>

          <label className={`relative flex cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
            selectedMethod === 'virtual_account' 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
          }`}>
            <input type="radio" name="payment" value="virtual_account" className="sr-only" checked={selectedMethod === 'virtual_account'} onChange={(e) => setSelectedMethod(e.target.value)} />
            <div className="flex items-center gap-4 w-full">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selectedMethod === 'virtual_account' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selectedMethod === 'virtual_account' && <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
              </div>
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-3xl">account_balance</span>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white font-bold tracking-wide">Virtual Account / Transfer</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Direct bank transfer</p>
              </div>
            </div>
          </label>
        </div>

        <div className="mt-auto pt-4 space-y-6">
          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl">
            <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400">shield</span>
            <div>
              <p className="text-indigo-700 dark:text-indigo-300 font-bold text-sm tracking-wide mb-1 uppercase">Escrow Protection</p>
              <p className="text-indigo-600/80 dark:text-indigo-200/70 text-xs leading-relaxed">
                Your funds are held securely until the artwork is delivered and approved by you.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-xl tracking-widest uppercase shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">payments</span>
            Pay Now
          </button>
        </div>
      </form>
    </div>
  );

  const renderLoading = () => (
    <div className="bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col items-center justify-center text-center relative h-full min-h-[500px] animate-in fade-in duration-500">
      <div className="relative w-24 h-24 mb-10">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-b-transparent animate-[spin_1.5s_linear_infinite_reverse] opacity-70"></div>
        <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 text-3xl animate-pulse">lock</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-wide">Sedang Memproses Transaksi...</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        Jangan tutup atau refresh halaman ini, kami sedang menghubungkan Anda ke gerbang pembayaran aman.
      </p>
    </div>
  );

  const renderInstruction = () => (
    <div className="bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col relative h-full animate-in slide-in-from-right duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-wide">Selesaikan Pembayaran Anda</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Dana Anda akan disimpan dengan aman di sistem Escrow dan hanya akan cair setelah Anda menyetujui hasil karya artist.</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8 flex-1">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Metode Pembayaran</p>
          <p className="font-bold text-slate-900 dark:text-white">
            Virtual Account ({selectedMethod === 'ewallet' ? 'e-Wallet' : selectedMethod === 'virtual_account' ? 'Bank Transfer' : 'Credit Card'})
          </p>
        </div>
        
        {selectedMethod === 'ewallet' && qrCodeUrl ? (
          <div className="mb-6 flex flex-col items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Scan QRIS code to pay</p>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md">
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Nomor Virtual Account</p>
            <div className="flex items-center justify-between bg-white dark:bg-[#060913] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
              <span className="font-mono text-xl md:text-2xl font-bold tracking-wider text-slate-900 dark:text-white">88301 0812 3456 789</span>
              <button className="p-2 text-indigo-500 hover:bg-indigo-50 dark:/10 rounded-lg transition-colors group" title="Copy to clipboard">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">content_copy</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total Tagihan</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-cyan-400">${orderDetails.total.toFixed(2)}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <span className="material-symbols-outlined">timer</span>
            <span className="text-sm font-bold tracking-wide">Batas Waktu</span>
          </div>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-lg tracking-wide animate-pulse">23 Jam 59 Menit</span>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button 
          onClick={handleConfirmPayment} 
          className="w-full py-4 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          Cek Status Pembayaran
        </button>
        <button 
          onClick={() => setPaymentState('checkout')} 
          className="w-full py-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-bold transition-all"
        >
          Batal / Ganti Metode
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col items-center text-center relative h-full min-h-[500px] animate-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 dark:opacity-40 rounded-full animate-pulse"></div>
        <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">check_circle</span>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-wide">Pembayaran Berhasil Dikonfirmasi!</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
        Dana sebesar <span className="font-bold text-slate-700 dark:text-slate-200">${orderDetails.total.toFixed(2)}</span> kini berada dalam perlindungan Escrow. Kami telah memberitahu {orderDetails.artist} untuk mulai mengerjakan pesanan Anda.
      </p>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full mb-8 flex items-center justify-center gap-3">
        <span className="material-symbols-outlined text-indigo-500">draw</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Status Pesanan: <strong className="text-indigo-600 dark:text-cyan-400">In Progress (Sketching Phase)</strong></span>
      </div>

      <button 
        onClick={() => router.push(`/commissions/${orderDetails.id}`)} 
        className="w-full mt-auto py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-lg tracking-wide shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1"
      >
        Masuk ke Workspace Chat
      </button>
    </div>
  );

  const renderFailure = () => (
    <div className="bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col items-center text-center relative h-full min-h-[500px] animate-in slide-in-from-bottom duration-500">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
        <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-5xl">error</span>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-wide">Transaksi Tidak Berhasil</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
        Maaf, pembayaran Anda tidak dapat diproses oleh pihak bank.
      </p>

      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 w-full mb-8">
        <p className="text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Alasan: Insufficient Funds / Saldo tidak cukup
        </p>
      </div>

      <div className="w-full mt-auto space-y-3">
        <button 
          onClick={() => setPaymentState('checkout')} 
          className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold tracking-wide shadow-lg transition-all"
        >
          Coba Lagi
        </button>
        <button className="w-full py-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
          <span className="material-symbols-outlined">support_agent</span>
          Bantuan Support
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060913] relative overflow-hidden flex flex-col items-center py-12 px-4 font-['Space_Grotesk'] text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-32 h-32 border border-indigo-500/10 dark:border-cyan-500/20 rounded-lg rotate-45 animate-[spin_20s_linear_infinite]"></div>
      <div className="absolute bottom-[20%] left-[10%] w-24 h-24 border border-indigo-500/10 dark:border-indigo-500/20 rounded-full animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

      <button onClick={() => router.back()} className="self-start md:ml-12 mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors z-10 relative group">
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="font-bold tracking-widest uppercase text-sm">Return to Workspace</span>
      </button>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10 relative items-stretch">
        
        {/* LEFT: Invoice Card (Always visible) */}
        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-cyan-500/30 rounded-3xl p-8 lg:p-10 shadow-xl dark:shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden group hover:border-indigo-300 dark:hover:border-cyan-400/50 transition-all duration-500 flex flex-col h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-cyan-500 dark:to-indigo-500"></div>
          
          <div className="flex justify-between items-start mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
            <div>
              <p className="text-indigo-600 dark:text-cyan-400 font-bold tracking-widest text-sm mb-1 uppercase">Digital Invoice</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{orderDetails.id}</h2>
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10">
              <span className="material-symbols-outlined text-2xl text-indigo-600 dark:text-indigo-400">receipt_long</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Commissioning</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {orderDetails.artist.charAt(0)}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{orderDetails.artist}</p>
                <p className="text-sm text-indigo-600 dark:text-cyan-400">{orderDetails.service}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Base Price</span>
              <span className="font-mono">${orderDetails.basePrice.toFixed(2)}</span>
            </div>
            {orderDetails.addons.map((addon: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>+ {addon.name}</span>
                <span className="font-mono">${addon.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-cyan-500/30 pt-6 mt-auto">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest mb-1">Total Due</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-cyan-400 dark:to-indigo-400">
                  ${orderDetails.total.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Includes all taxes & fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Dynamic Payment Panel (Checkout/Loading/Instruction/Success/Failure) */}
        <div className="flex-1 min-h-[500px]">
          {paymentState === 'checkout' && renderCheckout()}
          {paymentState === 'loading' && renderLoading()}
          {paymentState === 'instruction' && renderInstruction()}
          {paymentState === 'success' && renderSuccess()}
          {paymentState === 'failure' && renderFailure()}
        </div>
      </div>

      {/* Dev Tools - Simulate States for Demo */}
      <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-white/20 z-50 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Demo Tools</span>
        <div className="flex gap-2 border-l border-slate-700 pl-3">
          <button onClick={() => setPaymentState('checkout')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${paymentState === 'checkout' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Checkout</button>
          <button onClick={() => setPaymentState('loading')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${paymentState === 'loading' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Loading</button>
          <button onClick={() => setPaymentState('instruction')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${paymentState === 'instruction' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Instruction</button>
          <button onClick={() => setPaymentState('success')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${paymentState === 'success' ? 'bg-green-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Success</button>
          <button onClick={() => setPaymentState('failure')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${paymentState === 'failure' ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>Failure</button>
        </div>
      </div>

    </div>
  );
}


