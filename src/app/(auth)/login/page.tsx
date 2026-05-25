"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    router.push('/');
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
          disabled={!authEmail || !authPassword}
          className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none transition-all hover:scale-[1.02] disabled:hover:scale-100"
        >
          Sign In
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
