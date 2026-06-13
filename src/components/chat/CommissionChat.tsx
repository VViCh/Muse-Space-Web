"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface CommissionChatProps {
  commissionId: number;
  mode: 'popup' | 'fullscreen';
  onClose?: () => void;
  onToggleFullscreen?: () => void;
}

export default function CommissionChat({ commissionId, mode, onClose, onToggleFullscreen }: CommissionChatProps) {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch commission details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/commissions/${commissionId}`);
        if (res.data?.isSuccess) {
          setActiveOrder(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch commission', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (commissionId) fetchOrder();
  }, [commissionId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!commissionId) return;
    try {
      const res = await api.get(`/commissions/${commissionId}/messages`);
      if (res.data?.isSuccess) {
        setMessages(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, [commissionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time messages via notifications
  useEffect(() => {
    if (!commissionId) return;
    const latestNotif = notifications[0];
    if (latestNotif?.actionUrl?.includes(`/commissions/${commissionId}`)) {
      fetchMessages();
    }
  }, [notifications, commissionId, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !activeOrder || isUploading) return;

    try {
      setIsUploading(true);
      let attachmentUrl = null;
      let attachmentType = null;

      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        const uploadRes = await api.post('/Media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data?.isSuccess) {
          attachmentUrl = uploadRes.data.data.url;
          attachmentType = uploadRes.data.data.type;
        }
      }

      // CRITICAL: Respect the backend casing fix 'Content'
      const res = await api.post(`/commissions/${activeOrder.id}/messages`, { 
        Content: newMessage,
        attachmentUrl,
        attachmentType
      });
      
      if (res.data?.isSuccess) {
        setMessages([...messages, res.data.data]);
        setNewMessage('');
        setAttachment(null);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !activeOrder) {
    return <div className="flex-1 flex items-center justify-center p-12 text-slate-500">Loading chat...</div>;
  }

  const isArtist = user?.id === activeOrder.artistId;
  const otherPartyUsername = isArtist ? activeOrder.requesterUsername : activeOrder.artistUsername;
  const otherPartyAvatar = isArtist ? activeOrder.requesterAvatarUrl : activeOrder.artistAvatarUrl;
  const avatarChar = otherPartyUsername ? otherPartyUsername.charAt(0).toUpperCase() : 'U';

  const containerClasses = mode === 'popup' 
    ? "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-full max-w-md h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col z-50 overflow-hidden"
    : "flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-slate-950/30 w-full h-full rounded-2xl border border-slate-200 dark:border-white/10";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
            {otherPartyAvatar ? (
              <img src={otherPartyAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              avatarChar
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{otherPartyUsername}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{activeOrder.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <button onClick={onToggleFullscreen} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
              <span className="material-symbols-outlined">{mode === 'popup' ? 'open_in_new' : 'close_fullscreen'}</span>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        <div className="text-center">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
            Order created on {new Date(activeOrder.createdAtUtc).toLocaleDateString()}
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div className="flex items-end gap-2 max-w-[85%] lg:max-w-[80%]">
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0 mb-1 overflow-hidden">
                    {msg.senderAvatarUrl ? (
                      <img src={msg.senderAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      msg.senderUsername.charAt(0).toUpperCase()
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-bl-sm"
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <div className="mb-2">
                        {msg.attachmentType?.startsWith("image/") ? (
                          <img
                            src={msg.attachmentUrl}
                            alt="attachment"
                            className="max-w-[200px] max-h-40 rounded-lg object-contain cursor-pointer border border-white/10"
                            onClick={() => window.open(msg.attachmentUrl, "_blank")}
                          />
                        ) : msg.attachmentType?.startsWith("video/") ? (
                          <video src={msg.attachmentUrl} controls className="max-w-[200px] max-h-40 rounded-lg object-contain border border-white/10" />
                        ) : (
                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="underline flex items-center gap-1 text-sm">
                            <span className="material-symbols-outlined text-[16px]">attach_file</span>
                            Attached File
                          </a>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 px-1">
                    {new Date(msg.createdAtUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shrink-0">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
          {attachment && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg w-fit">
              <span className="material-symbols-outlined text-sm">attach_file</span>
              <span className="text-xs font-medium truncate max-w-[150px]">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} className="hover:text-red-500 transition-colors ml-2">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors shrink-0"
              disabled={isUploading}
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
            }} />
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isUploading}
                placeholder="Message..."
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-transparent focus:border-indigo-500/50 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none max-h-24 min-h-[42px] custom-scrollbar"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={(!newMessage.trim() && !attachment) || isUploading}
              className="p-2.5 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all shrink-0 flex items-center justify-center"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">send</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

