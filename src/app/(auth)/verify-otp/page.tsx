"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [otp, setOtp] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      // Simulate verification
      router.push('/login');
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-8 shadow-2xl shadow-slate-300/50 dark:shadow-indigo-900/20 animate-[fadeIn_0.3s_ease-out] backdrop-blur-xl w-full transition-colors duration-300">
      <div className="flex flex-col items-center gap-3 mb-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 border border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-3xl">mark_email_read</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
          Check Your Email
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          We've sent a 6-digit one-time password to your email address.
        </p>
      </div>
      
      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">One-Time Password</label>
          <input 
            type="text" 
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center tracking-[0.5em] font-mono text-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
            placeholder="000000"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={otp.length !== 6}
          className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none transition-all hover:scale-[1.02] disabled:hover:scale-100"
        >
          Verify OTP
        </button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button 
              type="button"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              Resend OTP
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
