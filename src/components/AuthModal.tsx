"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      // Delay unmounting to allow for exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAuthModalOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={closeAuthModal}
    >
      <div 
        className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl transition-all duration-300 transform ${isAuthModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full backdrop-blur-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Sign in Required</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            You need to be logged in to interact with artworks, follow artists, or leave comments. Join the Muse Space community today!
          </p>

          <div className="flex flex-col w-full gap-4">
            <Link 
              href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`}
              onClick={closeAuthModal}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center"
            >
              Log In
            </Link>
            <Link 
              href={`/register?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`}
              onClick={closeAuthModal}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex justify-center items-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
