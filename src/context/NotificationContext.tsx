"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

export interface INotificationResponse {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAtUtc: string;
  relatedUserId: number | null;
  relatedUserUsername: string | null;
  relatedUserAvatarUrl: string | null;
  relatedArtworkId: number | null;
  relatedArtworkThumbnailUrl: string | null;
}

interface NotificationContextType {
  notifications: INotificationResponse[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<INotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.items || []);
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();

      // Setup SignalR connection
      const token = localStorage.getItem('token');
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/hubs/notifications') || 'http://localhost:5242/hubs/notifications', {
          accessTokenFactory: () => token || '',
        })
        .withAutomaticReconnect()
        .build();

      setConnection(newConnection);

      newConnection.start()
        .then(() => {
          console.log('SignalR Connected!');
          newConnection.on('ReceiveNotification', (notification: INotificationResponse) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      return () => {
        newConnection.stop();
      };
    } else {
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const markAsRead = async (id: number) => {
    try {
      const res = await api.post(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.post(`/notifications/read-all`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
