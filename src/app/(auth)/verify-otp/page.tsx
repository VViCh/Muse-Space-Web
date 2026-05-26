"use client";

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(Number(char)))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the last filled input or the very end
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      setIsLoading(true);
      setError(null);
      try {
        // Need to retrieve email that requested OTP (ideally from state, context, or session storage)
        const email = sessionStorage.getItem('registerEmail');
        if (!email) {
          setError("Session expired. Please try registering again.");
          setIsLoading(false);
          return;
        }

        const response = await api.post('/auth/otp/verify-email', {
          email,
          otpCode: otpValue,
          type: "EmailVerification"
        });

        if (response.data?.isSuccess) {
          router.push('/login');
        } else {
          setError(response.data?.message || "Verification failed");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
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
      
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">Enter One-Time Password</label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                type="text"
                name="otp"
                maxLength={1}
                key={index}
                value={data}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onFocus={e => e.target.select()}
                required
              />
            ))}
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={otp.join('').length !== 6 || isLoading}
          className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none transition-all hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            'Verify OTP'
          )}
        </button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button 
              type="button"
              className="text-indigo-500 hover:text-indigo-400 font-bold transition-colors"
              onClick={async () => {
                const email = sessionStorage.getItem('registerEmail');
                if (email) {
                  try {
                    await api.post('/auth/otp/generate', { email, type: 'EmailVerification' });
                    alert("OTP Resent to " + email);
                  } catch (e) {
                    alert("Failed to resend OTP");
                  }
                }
              }}
            >
              Resend OTP
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
