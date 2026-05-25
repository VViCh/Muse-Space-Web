"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  isMember: boolean;
  iconUrl?: string;
  icon?: string;
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<Group[]>([
    { id: 1, name: "Digital Pioneers", description: "A community for 3D and digital artists pushing boundaries.", members: 1204, isMember: false, iconUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=60" },
    { id: 2, name: "Abstract Visionaries", description: "Exploring the depths of non-representational art forms.", members: 856, isMember: false, iconUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=150&auto=format&fit=crop&q=60" },
    { id: 3, name: "Pixel Perfect", description: "Retro aesthetics, pixel art, and low-res wonders.", members: 2100, isMember: false, iconUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=60" }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState<string | null>(null);

  const handleJoin = (id: number) => {
    setGroups(groups.map(g => {
      if (g.id === id) {
        return { ...g, isMember: true, members: g.members + 1 };
      }
      return g;
    }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    const newGroup: Group = {
      id: Date.now(),
      name: newGroupName,
      description: newGroupDesc,
      members: 1,
      isMember: true,
      iconUrl: newGroupIcon || undefined,
      icon: newGroupIcon ? undefined : 'group'
    };

    setGroups([newGroup, ...groups]);
    setShowModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupIcon(null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewGroupIcon(url);
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
          {[
            { id: 1, title: 'Galactic Art Showcase', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60' },
            { id: 2, title: 'Cyberpunk Workshop', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60' },
            { id: 3, title: 'Digital Meetup', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60' },
            { id: 4, title: '3D Artists Forum', img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&auto=format&fit=crop&q=60' },
            { id: 5, title: 'Abstract Gallery', img: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=500&auto=format&fit=crop&q=60' }
          ].map((event) => (
            <div key={event.id} className="min-w-[300px] snap-center bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-colors shadow-sm">
              <div className="h-32 bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border-b border-slate-200 dark:border-white/10 overflow-hidden">
                <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">OCT 24 • 8:00 PM EST</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{event.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Virtual Exhibition Hall</p>
                <Link
                  href={`/events/${event.id}`}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors text-center block"
                >
                  {t('groups.btn_rsvp', 'RSVP Now')}
                </Link>
              </div>
            </div>
          ))}
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
          {groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:border-indigo-500/50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {group.iconUrl ? (
                    <img src={group.iconUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">{group.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg">{group.name}</h3>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {t('groups.members_count', { count: group.members.toLocaleString() })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm flex-1">{group.description}</p>

              {group.isMember ? (
                <Link
                  href={`/groups/${group.id}`}
                  className="w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/50"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> {t('groups.btn_view_workspace', 'View Workspace')}
                </Link>
              ) : (
                <button
                  onClick={() => handleJoin(group.id)}
                  className="w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span> {t('groups.btn_join_group', 'Join Group')}
                </button>
              )}
            </div>
          ))}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('groups.label_group_icon', 'Group Icon')}</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {newGroupIcon ? (
                      <img src={newGroupIcon} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">image</span>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 border-dashed rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span className="text-sm font-medium">{t('groups.btn_upload_image', 'Upload Image')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                  </label>
                </div>
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
