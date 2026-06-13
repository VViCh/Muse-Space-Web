"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
  bannerUrl: string;
}

export default function GroupsExplore() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, showAuthModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        if (response.data?.isSuccess) {
          setGroups(response.data.data.items || response.data.data);
        }
      } catch (err) {
        console.error("Failed to load groups", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleJoin = async (id: number) => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    setGroups(groups.map(g => {
      if (g.id === id) {
        return { ...g, isMember: true, memberCount: g.memberCount + 1 };
      }
      return g;
    }));
    try {
      await api.post(`/groups/${id}/join`);
      router.push(`/groups/${id}`);
    } catch (e) {
      console.error("Failed to join group", e);
      setGroups(groups.map(g => {
        if (g.id === id) {
          return { ...g, isMember: false, memberCount: g.memberCount - 1 };
        }
        return g;
      }));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading groups...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Explore Groups</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Find communities that share your creative passion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groups.length > 0 ? groups.map((group) => (
          <div key={group.id} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                {group.bannerUrl ? (
                  <img src={group.bannerUrl} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">group</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg truncate">{group.name}</h3>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {group.memberCount?.toLocaleString()} Members
                </div>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm flex-1">{group.description}</p>

            <div className="mt-auto">
              {group.isMember ? (
                <Link href={`/groups/${group.id}`}
                  className="w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/50"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> Open Group
                </Link>
              ) : (
                <button
                  onClick={() => handleJoin(group.id)}
                  className="w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span> Join Group
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p>No active groups found.</p>
          </div>
        )}
      </div>
    </div>
  );
}


