"use client";
import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Commission {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterAvatarUrl?: string;
  artistId: number;
  artistUsername: string;
  artistAvatarUrl?: string;
  title: string;
  description: string;
  price: number;
  status: number;
  deadlineUtc?: string;
  completedAtUtc?: string;
  createdAtUtc: string;
}

const STATUS_MAP: Record<number, { label: string; color: string; icon: string }> = {
  0: { label: 'Pending',            color: 'text-amber-500  bg-amber-500/10  border-amber-500/20',  icon: 'pending' },
  1: { label: 'Accepted',           color: 'text-blue-400   bg-blue-500/10   border-blue-500/20',   icon: 'check_circle' },
  2: { label: 'Pending Verification', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: 'security' },
  3: { label: 'Rejected',           color: 'text-rose-500   bg-rose-500/10   border-rose-500/20',   icon: 'cancel' },
  4: { label: 'In Progress',        color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: 'brush' },
  5: { label: 'Completed',          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'task_alt' },
  6: { label: 'Cancelled',          color: 'text-slate-400  bg-slate-500/10  border-slate-500/20',  icon: 'remove_circle' },
};

type TabType = 'requested' | 'received';
type FilterStatus = 'all' | number;

const PAGE_SIZE = 100;

interface AvatarProps {
  url?: string;
  username: string;
  size?: number;
}

// Memoized Avatar component
const Avatar = memo<AvatarProps>(({ url, username, size = 10 }) => {
  return (
    <div
      style={{ width: size * 4, height: size * 4 }}
      className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
    >
      {url ? (
        <img src={url} alt={username} className="w-full h-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <span className="text-sm">{username.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Utility functions
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

const getDaysUntilDeadline = (deadlineUtc?: string) => {
  if (!deadlineUtc) return null;
  return Math.ceil((new Date(deadlineUtc).getTime() - Date.now()) / 86400000);
};

// Memoized Commission Card
interface CommissionCardProps {
  commission: Commission;
  isArtist: boolean;
}

const CommissionCard = memo<CommissionCardProps>(({ commission: c, isArtist }) => {
  const st = STATUS_MAP[c.status] ?? STATUS_MAP[0];
  const otherUser = isArtist ? c.requesterUsername : c.artistUsername;
  const otherAvatar = isArtist ? c.requesterAvatarUrl : c.artistAvatarUrl;
  const daysUntilDeadline = getDaysUntilDeadline(c.deadlineUtc);
  const deadlineUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && c.status === 4;

  return (
    <Link
      href={`/commissions/${c.id}`}
      className="group block bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar url={otherAvatar} username={otherUser} size={12} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {c.title}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.color}`}>
              <span className="material-symbols-outlined text-[12px]">{st.icon}</span>
              {st.label}
            </span>
            {deadlineUrgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                <span className="material-symbols-outlined text-[12px]">timer</span>
                {daysUntilDeadline}d left
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">
                {isArtist ? 'person' : 'brush'}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{otherUser}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              {formatRelative(c.createdAtUtc)}
            </span>
            {c.deadlineUtc && (
              <span className={`flex items-center gap-1 ${deadlineUrgent ? 'text-red-400' : ''}`}>
                <span className="material-symbols-outlined text-[15px]">event</span>
                Due {formatDate(c.deadlineUtc)}
              </span>
            )}
          </div>

          {c.description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
              {c.description}
            </p>
          )}
        </div>

        {/* Price + CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
            ${c.price.toFixed(0)}
          </span>

          {/* Quick actions based on status */}
          {isArtist && c.status === 0 && (
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Action needed
            </span>
          )}
          {!isArtist && c.status === 0 && (
            <span className="text-xs font-bold text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              Awaiting artist
            </span>
          )}
          {!isArtist && c.status === 1 && (
            <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">payments</span>
              Pay now
            </span>
          )}
          {c.status === 5 && (
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {isArtist ? `Earned $${c.price.toFixed(0)}` : 'Delivered'}
            </span>
          )}

          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all text-[20px]">
            chevron_right
          </span>
        </div>
      </div>

      {/* Progress bar for in-progress */}
      {c.status === 4 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Work in progress</span>
            {c.deadlineUtc && (
              <span className={deadlineUrgent ? 'text-red-400 font-bold' : ''}>
                {daysUntilDeadline !== null && daysUntilDeadline > 0
                  ? `${daysUntilDeadline} days remaining`
                  : 'Deadline passed'}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      )}
    </Link>
  );
});

CommissionCard.displayName = 'CommissionCard';

export default function CommissionsListPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('requested');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [requested, setRequested] = useState<Commission[]>([]);
  const [received, setReceived] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch commissions
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [reqRes, recRes] = await Promise.all([
          api.get(`/commissions/requested?pageSize=${PAGE_SIZE}`),
          api.get(`/commissions/received?pageSize=${PAGE_SIZE}`),
        ]);
        setRequested(reqRes.data?.data?.items || []);
        setReceived(recRes.data?.data?.items || []);
      } catch (err) {
        console.error('Failed to fetch commissions', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchAll();
  }, [user]);

  // Memoize active list
  const activeList = useMemo(
    () => activeTab === 'requested' ? requested : received,
    [activeTab, requested, received]
  );

  // Memoize filtered list
  const filtered = useMemo(() => {
    return activeList.filter((c) => {
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (activeTab === 'requested'
          ? c.artistUsername.toLowerCase().includes(q)
          : c.requesterUsername.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [activeList, filterStatus, searchQuery, activeTab]);

  // Memoize status counts for both tabs
  const statusCounts = useMemo(() => {
    return activeList.reduce<Record<number, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
  }, [activeList]);

  // Memoize counts for both lists separately (for tab display)
  const requestedCounts = useMemo(() => {
    return requested.reduce<Record<number, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
  }, [requested]);

  const receivedCounts = useMemo(() => {
    return received.reduce<Record<number, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
  }, [received]);

  // Memoize summary stats
  const stats = useMemo(() => {
    const pendingCount = received.filter((c) => c.status === 0).length;
    const activeCount = received.filter((c) => c.status === 4 || c.status === 1).length;
    const doneCount = received.filter((c) => c.status === 5).length;
    const totalRevenue = received.filter((c) => c.status === 5).reduce((s, c) => s + c.price, 0);
    return { pendingCount, activeCount, doneCount, totalRevenue };
  }, [received]);

  // Memoize callbacks
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setFilterStatus('all');
    setSearchQuery('');
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    setFilterStatus(status);
  }, []);

  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  return (
    <div className="min-h-screen pb-16 animate-[fadeIn_0.3s_ease-out]">
      {selectedCommission ? (
        <CommissionDetailWithChat
          commission={selectedCommission}
          isArtist={selectedCommission.artistId === user?.id}
          onBack={() => setSelectedCommission(null)}
        />
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-1">
                Commissions
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Manage your commission requests and received orders.
              </p>
            </div>
            <Link
              href="/commissions"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Find Artists
            </Link>
          </div>

          {/* Stats strip (artist-side overview) */}
          {received.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Awaiting Reply', value: stats.pendingCount,  icon: 'pending',    color: 'text-amber-400' },
                { label: 'In Progress',    value: stats.activeCount,   icon: 'brush',      color: 'text-violet-400' },
                { label: 'Completed',      value: stats.doneCount,     icon: 'task_alt',   color: 'text-emerald-400' },
                { label: 'Total Revenue',  value: `$${stats.totalRevenue.toFixed(0)}`, icon: 'payments', color: 'text-indigo-400' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                  <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit mb-6">
            {(['requested', 'received'] as TabType[]).map((tab) => {
              const counts = tab === 'requested' ? requestedCounts : receivedCounts;
              const total  = Object.values(counts).reduce((a, b) => a + b, 0);
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab === 'requested' ? 'shopping_bag' : 'inbox'}
                  </span>
                  {tab === 'requested' ? 'My Requests' : 'Received Orders'}
                  {total > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTab === tab
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}>
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={activeTab === 'requested' ? 'Search by title or artist…' : 'Search by title or requester…'}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Status pills */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/30'
                }`}
              >
                All
              </button>
              {[0, 1, 4, 5, 3, 6].map((s) => {
                const st = STATUS_MAP[s];
                const cnt = statusCounts[s] || 0;
                if (cnt === 0) return null;
                return (
                  <button
                    key={s}
                    onClick={() => handleFilterChange(s)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 ${
                      filterStatus === s
                        ? `${st.color} border-current`
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/30'
                    }`}
                  >
                    {st.label}
                    <span className="opacity-70 text-xs">{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">inbox</span>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-1">
                {searchQuery || filterStatus !== 'all' ? 'No matches found' : activeTab === 'requested' ? 'No commission requests yet' : 'No orders received yet'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                {activeTab === 'requested'
                  ? 'Head to the commissions page to find an artist and place your first request.'
                  : 'Enable commissions in your settings to start receiving orders.'}
              </p>
              {activeTab === 'requested' && (
                <Link href="/commissions" className="mt-5 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                  Browse Artists
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommission(c)}
                  className="w-full text-left"
                >
                  <CommissionCard commission={c} isArtist={activeTab === 'received'} />
                </button>
              ))}
            </div>
          )}

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <p className="text-center text-sm text-slate-400 mt-8">
              Showing {filtered.length} of {activeList.length} commission{activeList.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Commission Detail with Chat Component
interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  createdAtUtc: string;
}

interface CommissionDetailWithChatProps {
  commission: Commission;
  isArtist: boolean;
  onBack: () => void;
}

const CommissionDetailWithChat = memo<CommissionDetailWithChatProps>(
  ({ commission: c, isArtist, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Fetch messages
    useEffect(() => {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const res = await api.get(`/commissions/${c.id}/messages`);
          const messagesData = res.data?.data?.items || res.data?.data || [];
          setMessages(Array.isArray(messagesData) ? messagesData : []);
        } catch (err) {
          console.error('Failed to fetch messages', err);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchMessages();
    }, [c.id]);

    // Auto-scroll to latest message
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSendMessage = useCallback(async () => {
      if (!newMessage.trim()) return;

      const messageText = newMessage;
      setNewMessage('');

      try {
        setIsSending(true);
        coContent = await api.post(`/commissions/${c.id}/messages`, {
          message: messageText,
        });

        if (res.data?.data) {
          setMessages((prev) => [...prev, res.data.data]);
        }
      } catch (err) {
        console.error('Failed to send message', err);
        setNewMessage(messageText);
      } finally {
        setIsSending(false);
      }
    }, [newMessage, c.id]);

    const otherUser = isArtist ? c.requesterUsername : c.artistUsername;
    const otherAvatar = isArtist ? c.requesterAvatarUrl : c.artistAvatarUrl;
    const st = STATUS_MAP[c.status] ?? STATUS_MAP[0];
    const daysUntilDeadline = getDaysUntilDeadline(c.deadlineUtc);
    const deadlineUrgent =
      daysUntilDeadline !== null && daysUntilDeadline <= 3 && c.status === 4;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-semibold text-slate-900 dark:text-white">Back</span>
            </button>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${st.color}`}>
              <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
              {st.label}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Commission Details - Left Side */}
            <div className="lg:col-span-1 space-y-6">
              {/* User Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar url={otherAvatar} username={otherUser} size={14} />
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
                      {isArtist ? 'Commission from' : 'Commission by'}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{otherUser}</h3>
                  </div>
                </div>
              </div>

              {/* Commission Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                    Title
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.title}</h2>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{c.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                      Price
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${c.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                      Created
                    </p>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {formatDate(c.createdAtUtc)}
                    </p>
                  </div>
                </div>

                {c.deadlineUtc && (
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                      Deadline
                    </p>
                    <div
                      className={`p-3 rounded-xl font-semibold ${
                        deadlineUrgent
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {formatDate(c.deadlineUtc)}{' '}
                      {deadlineUrgent && daysUntilDeadline !== null && (
                        <span className="ml-2 text-xs">({daysUntilDeadline}d left)</span>
                      )}
                    </div>
                  </div>
                )}

                {c.completedAtUtc && (
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">
                      Completed
                    </p>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {formatDate(c.completedAtUtc)}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {isArtist && c.status === 0 && (
                  <>
                    <button className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                      Accept Commission
                    </button>
                    <button className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                      Decline
                    </button>
                  </>
                )}
                {!isArtist && c.status === 1 && (
                  <button className="w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    Pay Now
                  </button>
                )}
                {c.status === 5 && (
                  <button className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl">
                    <span className="material-symbols-outlined inline mr-2">check_circle</span>
                    Completed
                  </button>
                )}
              </div>
            </div>

            {/* Chat - Right Side */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">chat</span>
                  Chat with {otherUser}
                </h3>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-slate-500 dark:text-slate-400">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-slate-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar url={msg.senderAvatarUrl} username={msg.senderUsername} size={8} />
                      <div className={`flex-1 ${msg.senderId === user?.id ? 'items-end' : ''} flex flex-col`}>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-3">
                          {msg.senderId === user?.id ? 'You' : msg.senderUsername} •{' '}
                          {formatRelative(msg.createdAtUtc)}
                        </p>
                        <div
                          className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                            msg.senderId === user?.id
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CommissionDetailWithChat.displayName = 'CommissionDetailWithChat';
