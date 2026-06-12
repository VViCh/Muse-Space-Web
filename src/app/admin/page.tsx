"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'reports' | 'events'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Event Creation State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDateUtc: '',
    endDateUtc: '',
    location: '',
    isOnline: true,
    eventUrl: '',
    bannerUrl: ''
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    // Basic protection: if not logged in
    if (!isAuthenticated) return;
    
    // Usually we would check user.role === 'Admin' but let's just try the API
    // If it 403s, we will catch it.
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data?.isSuccess) setStats(statsRes.data.data);

        const reportsRes = await api.get('/admin/reports');
        if (reportsRes.data?.isSuccess) setReports(reportsRes.data.data.items || []);
      } catch (err: any) {
        console.error('Failed to load admin data', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          router.push('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthenticated, router]);

  const handleReviewReport = async (reportId: number, status: string) => {
    try {
      const res = await api.post(`/admin/reports/${reportId}/review`, { status, adminNotes: "Reviewed via Admin Panel" });
      if (res.data?.isSuccess) {
        // Remove from list or update
        setReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error("Failed to review report", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingEvent(true);
    setEventMessage(null);
    try {
      const res = await api.post('/events', {
        ...eventForm,
        startDateUtc: new Date(eventForm.startDateUtc).toISOString(),
        endDateUtc: new Date(eventForm.endDateUtc).toISOString()
      });
      if (res.data?.isSuccess) {
        setEventMessage({ type: 'success', text: 'Event created successfully!' });
        setEventForm({ title: '', description: '', startDateUtc: '', endDateUtc: '', location: '', isOnline: true, eventUrl: '', bannerUrl: '' });
      } else {
        setEventMessage({ type: 'error', text: 'Failed to create event.' });
      }
    } catch (err: any) {
      setEventMessage({ type: 'error', text: err.response?.data?.message || 'Error creating event' });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  if (isLoading) return <div className="text-center p-12 text-slate-500">Loading admin panel...</div>;
  if (!stats) return <div className="text-center p-12 text-red-500">Access Denied or Failed to load.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-indigo-500 text-4xl">admin_panel_settings</span>
            Admin Panel
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage platform content, users, and moderation queues.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 mb-8">
        <button
          onClick={() => setTab('overview')}
          className={`px-6 py-3 font-bold border-b-2 transition-colors ${tab === 'overview' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${tab === 'reports' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Moderation Queue
          {stats.pendingReports > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pendingReports}</span>
          )}
        </button>
        <button
          onClick={() => setTab('events')}
          className={`px-6 py-3 font-bold border-b-2 transition-colors ${tab === 'events' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Create Event
        </button>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">group</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase mb-1">Total Users</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">brush</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase mb-1">Artworks</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalArtworks}</p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">flag</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase mb-1">Total Reports</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalReports}</p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">block</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase mb-1">Banned Users</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.bannedUsers}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 dark:text-white">Pending Reports</h2>
          </div>
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm">
                    <th className="p-4 font-medium">Artwork</th>
                    <th className="p-4 font-medium">Reported By</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Reason</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{report.artworkTitle}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{report.reportedByUsername}</td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-xs font-bold uppercase">
                          {report.reportType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm max-w-[200px] truncate" title={report.reason}>{report.reason}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(report.createdAtUtc).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleReviewReport(report.id, 'Rejected')}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-bold transition-colors"
                        >
                          Dismiss
                        </button>
                        <button 
                          onClick={() => handleReviewReport(report.id, 'Approved')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors"
                        >
                          Approve (Takedown)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4">check_circle</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">All caught up!</h3>
              <p className="text-slate-500 dark:text-slate-400">There are no pending reports in the moderation queue.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">event</span>
            Create New Event
          </h2>
          
          {eventMessage && (
            <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 ${eventMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
              <span className="material-symbols-outlined">{eventMessage.type === 'success' ? 'check_circle' : 'error'}</span>
              <p className="font-medium text-sm">{eventMessage.text}</p>
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-5 text-slate-900 dark:text-white">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Event Title *</label>
              <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="E.g., Global Digital Art Expo" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description *</label>
              <textarea required value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none" placeholder="Details about the event..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Date & Time *</label>
                <input required type="datetime-local" value={eventForm.startDateUtc} onChange={e => setEventForm({...eventForm, startDateUtc: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Date & Time *</label>
                <input required type="datetime-local" value={eventForm.endDateUtc} onChange={e => setEventForm({...eventForm, endDateUtc: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
              <input type="checkbox" id="isOnline" checked={eventForm.isOnline} onChange={e => setEventForm({...eventForm, isOnline: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isOnline" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">This is an online event</label>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{eventForm.isOnline ? 'Stream URL / Link' : 'Physical Location'}</label>
              <input type="text" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder={eventForm.isOnline ? "https://zoom.us/..." : "123 Main St..."} />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Banner Image URL</label>
              <input type="url" value={eventForm.bannerUrl} onChange={e => setEventForm({...eventForm, bannerUrl: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="https://..." />
            </div>

            <div className="pt-4">
              <button disabled={isCreatingEvent} type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isCreatingEvent ? 'Creating Event...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
