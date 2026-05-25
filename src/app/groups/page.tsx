"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export interface GroupResponse {
  id: number;
  name: string;
  description: string;
  avatarUrl: string;
  memberCount: number;
}

export interface EventResponse {
  id: number;
  title: string;
  bannerUrl: string;
  startDateUtc: string;
  location: string;
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, eventRes] = await Promise.all([
          api.get('/group'),
          api.get('/event')
        ]);
        if (groupRes.data?.success) setGroups(groupRes.data.data.items || groupRes.data.data);
        if (eventRes.data?.success) setEvents(eventRes.data.data.items || eventRes.data.data);
      } catch (err) {
        console.error("Failed to fetch groups and events", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoin = async (id: number) => {
    try {
      await api.post(`/group/${id}/join`);
      alert("Join request sent or joined successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to join group");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    try {
      const response = await api.post('/group', {
        name: newGroupName,
        description: newGroupDesc,
        isPrivate: false
      });
      if (response.data?.success) {
        setGroups([response.data.data, ...groups]);
        setShowModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
      }
    } catch (e) {
      console.error("Failed to create group", e);
      alert("Failed to create group");
    }
  };

  return (
    <div className="p-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">{t('groups.title', 'Communities')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">{t('groups.subtitle', 'Find your tribe in the cosmos.')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined">add_circle</span> {t('groups.btn_create_group', 'Create Group')}
        </button>
      </div>

      {/* Events Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400">event</span> {t('groups.events_title', 'Events')}
          </h2>
          <Link href="/events" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            View More
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
          {isLoading ? (
            <div className="w-full text-center p-8 text-slate-500">Loading events...</div>
          ) : events.length > 0 ? events.map((event) => (
            <div key={event.id} className="min-w-[300px] snap-center bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-colors shadow-sm flex flex-col">
              <div className="h-32 bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border-b border-slate-200 dark:border-white/10 overflow-hidden">
                {event.bannerUrl ? <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-indigo-300">event</span>}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  {new Date(event.startDateUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-1">{event.location || 'Virtual'}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors text-center block"
                  >
                    {t('groups.btn_rsvp', 'RSVP Now')}
                  </Link>
                </div>
              </div>
            </div>
          )) : (
            <div className="w-full text-center p-8 text-slate-500">No events found.</div>
          )}
        </div>
      </div>

      {/* Groups Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400">group</span> {t('groups.groups_title', 'Groups')}
          </h2>
          <Link href="/groups/explore" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            View More
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center p-8 text-slate-500">Loading groups...</div>
          ) : groups.length > 0 ? groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:border-indigo-500/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">group</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg truncate">{group.name}</h3>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {t('groups.members_count', { count: group.memberCount.toLocaleString() })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm flex-1 line-clamp-3">{group.description}</p>

              <button
                onClick={() => handleJoin(group.id)}
                className="w-full py-2.5 mt-auto rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span> {t('groups.btn_join_group', 'Join Group')}
              </button>
            </div>
          )) : (
            <div className="col-span-full text-center p-8 text-slate-500">No groups found. Create one!</div>
          )}
        </div>
      </div>

      {/* Modal Section */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl shadow-slate-900/10 dark:shadow-indigo-900/20 my-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">{t('groups.modal_create_title', 'Create New Group')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('groups.label_group_name', 'Group Name')}</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t('groups.placeholder_group_name', 'e.g. Pixel Artists')}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('groups.label_description', 'Description')}</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder={t('groups.placeholder_description', 'What is this group about?')}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 resize-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold transition-colors">
                  {t('groups.btn_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || !newGroupDesc.trim()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {t('groups.btn_create', 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
