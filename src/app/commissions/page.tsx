"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function CommissionsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        // Fetch users using the search endpoint
        const res = await api.get('/search?query=');
        if (res.data?.isSuccess && res.data?.data?.users) {
          // Filter by 'isAcceptingCommissions' flag
          const acceptingArtists = res.data.data.users.filter((u: any) => u.isAcceptingCommissions);
          setArtists(acceptingArtists);
        }
      } catch (err) {
        console.error("Failed to load artists", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Commission Artists</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Find the perfect creator for your next project.</p>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-slate-500">Loading artists...</div>
      ) : artists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist, i) => (
            <div key={artist.userId || i} className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center group shadow-sm">
              <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 dark:border-indigo-500/50 mb-4 overflow-hidden group-hover:scale-105 transition-transform bg-slate-200 dark:bg-slate-800">
                {artist.avatarUrl ? (
                  <img src={artist.avatarUrl} alt={artist.username} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${artist.username}&background=6366f1&color=fff`} alt={artist.username} className="w-full h-full object-cover" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">@{artist.username}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{artist.bio || 'Digital Artist'}</p>
              
              <div className="px-4 py-1.5 rounded-full text-xs font-bold mb-4 bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20">
                Open for Commissions
              </div>

              <div className="flex flex-col items-center gap-1 mb-6 text-sm">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Starting from $25</span>
                <span className="text-slate-500 dark:text-slate-400">⭐ {4.5 + (i % 5)*0.1} • {artist.followersCount || 0} followers</span>
              </div>

              <Link 
                href={`/profile/${encodeURIComponent(artist.username)}`}
                className="w-full py-2.5 bg-indigo-600 dark:bg-white/5 hover:bg-indigo-700 dark:hover:bg-indigo-500/20 border border-transparent dark:border-white/10 hover:border-transparent dark:hover:border-indigo-500/50 text-white rounded-lg transition-all font-medium block shadow-[0_0_15px_rgba(79,70,229,0.2)] dark:shadow-none"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-12 text-center text-slate-500">
          No artists found.
        </div>
      )}
    </div>
  );
}
