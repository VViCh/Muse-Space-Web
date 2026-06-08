"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        email: authEmail,
        password: authPassword,
      });

      if (response.data?.success && response.data?.accessToken) {
        login(response.data.accessToken, response.data.user);
        router.push('/');
      } else {
        setError(response.data?.message || "Login failed");
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes("verify")) {
        // Handle unverified email
        sessionStorage.setItem('registerEmail', authEmail);
        router.push('/verify-otp');
      } else {
        setError(err.response?.data?.message || "Invalid credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-8 shadow-2xl shadow-slate-300/50 dark:shadow-indigo-900/20 animate-[fadeIn_0.3s_ease-out] backdrop-blur-xl w-full transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
          Welcome Back
        </h3>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-5">
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
          <input 
            type="email" 
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 pr-12"
              placeholder="Enter your password"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={!authEmail || !authPassword || isLoading}
          className="w-full py-3 mt-4 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] disabled:shadow-none transition-all hover:scale-[1.02] disabled:hover:scale-100 flex justify-center items-center"
        >
          {isLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Sign In'}
        </button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link 
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
