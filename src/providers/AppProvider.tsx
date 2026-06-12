"use client";

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { ArtworkProvider } from '@/context/ArtworkContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';

// Import locales
import enTranslation from '@/locales/en/translation.json';
import idTranslation from '@/locales/id/translation.json';
import jaTranslation from '@/locales/ja/translation.json';
import zhTranslation from '@/locales/zh/translation.json';

const resources = {
  en: { translation: enTranslation },
  id: { translation: idTranslation },
  ja: { translation: jaTranslation },
  zh: { translation: zhTranslation }
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en', // default, will be overridden by useEffect
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
}

const MENU_ITEMS = [
  { path: '/', labelKey: 'layout.nav_home', defaultLabel: 'Home', icon: 'home', exactMatch: true, matchPrefixes: ['/'] },
  { path: '/commissions', labelKey: 'layout.nav_commissions', defaultLabel: 'Commissions', icon: 'stadium', exactMatch: false, matchPrefixes: ['/commissions'] },
  { path: '/groups', labelKey: 'layout.nav_groups', defaultLabel: 'Groups & Events', icon: 'groups', exactMatch: false, matchPrefixes: ['/groups', '/events'] },
  { path: '/dashboard', labelKey: 'layout.nav_activities', defaultLabel: 'Dashboard', icon: 'dashboard', exactMatch: false, matchPrefixes: ['/dashboard'], requiresAuth: true },
  { path: '/search', labelKey: 'layout.nav_search', defaultLabel: 'Search', icon: 'search', exactMatch: false, matchPrefixes: ['/search'] }
];

export default function AppProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
    
    i18n.on('languageChanged', (lng) => {
      localStorage.setItem('language', lng);
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const searchQuery = searchParams.get('q') || '';
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/verify-otp');

  return (
    <AuthProvider>
      <NotificationProvider>
        {isAuthRoute ? (
          <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>
            <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="z-10 w-full max-w-md">
              {children}
            </div>
          </main>
        ) : (
          <AppLayout>{children}</AppLayout>
        )}
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 flex flex-col p-5 space-y-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 h-full w-64 rounded-r-lg z-[60] font-['Space_Grotesk'] font-medium transition-colors duration-300">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-bold leading-none transition-colors duration-300">{t('layout.app_name', 'Muse Space')}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest mt-1 transition-colors duration-300">{t('layout.app_tagline', 'The Artistic Hub')}</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {MENU_ITEMS.map((item) => {
            if (item.requiresAuth && !isAuthenticated) return null;
            
            const isActive = item.exactMatch 
              ? pathname === item.path 
              : item.matchPrefixes.some(prefix => pathname?.startsWith(prefix));

            return (
              <Link 
                key={item.path}
                href={item.path} 
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{t(item.labelKey, item.defaultLabel)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-10 space-y-4">
          <Link
            href="/upload"
            className="w-full bg-[#3d2db5] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(61,45,181,0.3)] hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            {t('layout.btn_upload', 'Upload Artwork')}
          </Link>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-64 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-50 flex justify-between items-center px-8 shadow-[0_0_15px_rgba(61,45,181,0.05)] dark:shadow-[0_0_15px_rgba(61,45,181,0.1)] transition-colors duration-300">
        <div className="flex items-center gap-6 flex-1">
          <form className="relative max-w-md w-full group" onSubmit={(e) => { 
            e.preventDefault(); 
            const val = (document.getElementById('navSearchInput') as HTMLInputElement)?.value;
            router.push(`/search?q=${encodeURIComponent(val || '')}`); 
          }}>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">search</span>
            <input
              id="navSearchInput"
              className="w-full bg-slate-100/80 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder={t('layout.search_placeholder', 'Search artworks, tags, users...')}
              type="text"
              defaultValue={searchQuery}
            />
          </form>
        </div>
        
        <div className="flex items-center gap-6 relative">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
          </button>
          
          <button 
            className={`transition-colors relative ${showNotifications ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount}</span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-slate-900 dark:text-white font-bold font-['Space_Grotesk']">Notifications</h3>
                <Link href="/notifications" onClick={() => setShowNotifications(false)} className="text-xs text-indigo-500 hover:underline">View All</Link>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                      if (notif.actionUrl) {
                        router.push(notif.actionUrl);
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-indigo-50/50 dark:bg-indigo-500/10'}`}
                  >
                    <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">{notif.message}</p>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-2 uppercase tracking-wider">
                      {new Date(notif.createdAtUtc).toLocaleString()}
                    </p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}

          <div 
            className={`w-10 h-10 rounded-full border overflow-hidden cursor-pointer transition-all ${showProfileMenu ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-indigo-500/30 hover:ring-4 hover:ring-indigo-500/10'}`}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            {user?.profileImageUrl ? (
              <img alt="Profile" className="w-full h-full object-cover bg-slate-200 dark:bg-slate-800" src={user.profileImageUrl} />
            ) : (
              <img alt="Profile" className="w-full h-full object-cover bg-slate-200 dark:bg-slate-800" src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=6366f1&color=fff`} />
            )}
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute top-14 right-0 w-48 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="py-2">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">login</span> {t('layout.menu_signin', 'Sign In')}
                    </Link>
                    <Link href="/register" onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">person_add</span> {t('layout.menu_signup', 'Sign Up')}
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 mb-1 border-b border-slate-200 dark:border-white/10">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link href={`/profile/${user?.username}`} onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">person</span> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">settings</span> {t('layout.menu_settings', 'Settings')}
                    </Link>
                    {/* Assuming admin role check here later if needed */}
                    <Link href="/admin" onClick={() => setShowProfileMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Admin Panel
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-white/10 my-1"></div>
                    <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-500 hover:text-red-700 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 px-8 pb-12 w-[calc(100%-16rem)]">
        <ArtworkProvider>
          {children}
        </ArtworkProvider>
      </main>
    </>
  );
}
