"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAtUtc: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?page=1&pageSize=50');
      if (response.data.isSuccess) {
        setNotifications(response.data.data.items);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NewLike': return <span className="material-symbols-outlined text-pink-500">favorite</span>;
      case 'NewComment': return <span className="material-symbols-outlined text-blue-500">chat_bubble</span>;
      case 'NewFollower': return <span className="material-symbols-outlined text-indigo-500">person_add</span>;
      case 'ArtworkApproved': return <span className="material-symbols-outlined text-emerald-500">check_circle</span>;
      default: return <span className="material-symbols-outlined text-slate-500">notifications</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white font-['Space_Grotesk']">
          <span className="material-symbols-outlined text-indigo-500 text-3xl">notifications</span> Notifications
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setShowUnreadOnly(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!showUnreadOnly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              All
            </button>
            <button 
              onClick={() => setShowUnreadOnly(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${showUnreadOnly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Unread
            </button>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllAsRead}
              className="text-sm px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span> Mark all as read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800/50 h-24 rounded-xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-100 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mx-auto mb-4 block">notifications_off</span>
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300">You're all caught up!</h2>
          <p className="text-slate-500 mt-2">No new notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.filter(n => showUnreadOnly ? !n.isRead : true).map((notification) => (
            <div 
              key={notification.id} 
              onClick={() => {
                if (!notification.isRead) markAsRead(notification.id);
                if (notification.actionUrl) router.push(notification.actionUrl);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                notification.isRead 
                  ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' 
                  : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)] dark:shadow-[0_0_15px_rgba(99,102,241,0.1)]'
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-xl flex items-center justify-center ${notification.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-indigo-900/50 shadow-sm'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-lg ${notification.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white font-medium'}`}>
                    {notification.message.length > 50 ? notification.message.substring(0, 50) + '...' : notification.message}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(notification.createdAtUtc).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
