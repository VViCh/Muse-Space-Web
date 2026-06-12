"use client";
import { useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import MasonryGrid from '@/components/MasonryGrid';
import { useArtwork, type Artwork } from '@/context/ArtworkContext';
import ArtworkCard from '@/components/ArtworkCard';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const MASONRY_BREAKPOINTS = {
  default: 4,
  1536: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1
};



export default function Dashboard() {

  const { artworks } = useArtwork();
  const { user } = useAuth();
  const [collectionTab, setCollectionTab] = useState<'my_artworks' | 'liked' | 'saved'>('my_artworks');
  const [showTicketModal, setShowTicketModal] = useState<any>(null);
  
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userArtworks, setUserArtworks] = useState<any[]>([]);
  const [likedArtworks, setLikedArtworks] = useState<any[]>([]);
  const [savedArtworks, setSavedArtworks] = useState<any[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats').catch(() => null);
        if (statsRes?.data?.isSuccess) setStats(statsRes.data.data);

        const fetchSafe = (url: string) => api.get(url).catch((err) => {
          console.error(`Failed to fetch ${url}`, err);
          return null;
        });

        const [commsRes, eventsRes, groupsRes, userArtworksRes, likedRes, savedRes] = await Promise.all([
          fetchSafe('/commissions/requested'),
          fetchSafe('/events/my-rsvps'),
          fetchSafe('/groups'),
          fetchSafe(`/Artwork/user/${user?.id || 0}`),
          fetchSafe('/Artwork/liked'),
          fetchSafe('/Artwork/bookmarked')
        ]);

        if (commsRes?.data?.isSuccess) setCommissions(commsRes.data.data.items || []);
        if (eventsRes?.data?.isSuccess) setEvents(eventsRes.data.data.items || eventsRes.data.data || []);
        if (groupsRes?.data?.isSuccess) setGroups(groupsRes.data.data.items || groupsRes.data.data || []);
        if (userArtworksRes?.data?.isSuccess) setUserArtworks(userArtworksRes.data.data.items || userArtworksRes.data.data || []);
        if (likedRes?.data?.isSuccess) setLikedArtworks(likedRes.data.data.items || []);
        if (savedRes?.data?.isSuccess) setSavedArtworks(savedRes.data.data.items || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('ticket') === 'true' && events.length > 0) {
      // Auto open the first event ticket
      setShowTicketModal(events[0]);
      // Remove query param to clean URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('ticket');
      router.replace(`?${newParams.toString()}`);
    }
  }, [searchParams, router]);

  const displayedArtworks = collectionTab === 'my_artworks' 
    ? userArtworks 
    : collectionTab === 'liked' ? likedArtworks : savedArtworks;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-2">My Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your metrics, commissions, and activities.</p>
        </div>
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          onClose={() => setSelectedArtwork(null)} 
        />
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-500 text-sm font-bold uppercase mb-2">Total Views</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">{stats.totalViews}</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-500 text-sm font-bold uppercase mb-2">Total Likes</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">{stats.totalLikes}</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-500 text-sm font-bold uppercase mb-2">Followers</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">{stats.totalFollowers}</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-500 text-sm font-bold uppercase mb-2">Revenue</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-['Space_Grotesk']">${stats.totalRevenue}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Events & Tickets */}
        <div className="xl:col-span-2 space-y-10">
          
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-500">confirmation_number</span>
                My Events & Tickets
              </h2>
              <Link href="/groups" className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">Find more</Link>
            </div>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => {
                  const d = new Date(event.startDateUtc);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  return (
                  <div key={event.id} className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        Registered
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          {dateStr} • {timeStr}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">videocam</span>
                          {event.isOnline ? 'Online Event' : event.location || 'In-Person'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                      <button 
                        onClick={() => setShowTicketModal({ ...event, date: dateStr, time: timeStr, type: event.isOnline ? 'Online Event' : event.location })}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                      >
                        <span className="material-symbols-outlined text-[18px]">local_activity</span>
                        View Ticket
                      </button>
                      <Link href={`/events/${event.id}`} className="py-2 px-4 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center">
                        Details
                      </Link>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">No events found.</p>
              </div>
            )}
          </section>

          {/* Commissions Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">design_services</span>
                My Commission Requests
              </h2>
              <Link href="/commissions" className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">Browse Artists</Link>
            </div>
            
            <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm">
                      <th className="p-4 font-medium">Artist</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length > 0 ? commissions.map((comm) => (
                      <tr key={comm.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{comm.artistUsername}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">Custom Request</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(comm.createdAtUtc).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            comm.status === 'Accepted' || comm.status === 'InProgress' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : comm.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {comm.status === 'Pending' ? 'pending' : comm.status === 'Completed' ? 'check_circle' : 'sync'}
                            </span>
                            {comm.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/commissions/${comm.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors">
                            View Thread
                          </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No commission requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Groups & Communities */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-3">
              <span className="material-symbols-outlined text-purple-500">group</span>
              My Communities
            </h2>
          </div>
          
          <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
            {groups.map((group) => (
              <Link href={`/groups/${group.id}`} key={group.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {group.avatarUrl ? <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">group</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 dark:text-white font-bold truncate">{group.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {group.memberCount?.toLocaleString() || 0}
                    </span>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded">
                      Member
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {groups.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">You haven't joined any groups yet.</div>
            )}
            
            <Link href="/groups" className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">explore</span>
              Discover Groups
            </Link>
          </div>
        </div>

      </div>

      {/* My Collection Section (Full Width) */}
      <section className="pt-10 border-t border-slate-200 dark:border-white/10 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500">collections</span>
            My Collection
          </h2>
          
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl flex-wrap sm:flex-nowrap gap-1">
            <button 
              onClick={() => setCollectionTab('my_artworks')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                collectionTab === 'my_artworks' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">brush</span>
              My Artworks
            </button>
            <button 
              onClick={() => setCollectionTab('liked')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                collectionTab === 'liked' 
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">favorite</span>
              Liked Artworks
            </button>
            <button 
              onClick={() => setCollectionTab('saved')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                collectionTab === 'saved' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
              Saved Artworks
            </button>
          </div>
        </div>

        {displayedArtworks.length > 0 ? (
          <MasonryGrid
            items={displayedArtworks}
            renderItem={(item) => (
              <div key={item.id}>
                <ArtworkCard 
                  artwork={item} 
                  onClick={setSelectedArtwork} 
                  onLike={(id) => {
                    if (collectionTab === 'liked') {
                      setLikedArtworks(prev => prev.filter(a => a.id !== id));
                    }
                  }}
                  onSave={(id) => {
                    if (collectionTab === 'saved') {
                      setSavedArtworks(prev => prev.filter(a => a.id !== id));
                    }
                  }}
                />
              </div>
            )}
          />
        ) : (
          <div className="bg-slate-100 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
              {collectionTab === 'liked' ? 'heart_broken' : collectionTab === 'saved' ? 'bookmark_remove' : 'broken_image'}
            </span>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No {collectionTab.replace('_', ' ')} yet.
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {collectionTab === 'my_artworks' ? 'Upload some artworks to see them here!' : `Explore the Home page to ${collectionTab} some artworks!`}
            </p>
          </div>
        )}
      </section>



      {/* Digital Ticket Modal */}
      {showTicketModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowTicketModal(null)}
        >
          <div 
            className="relative max-w-sm w-full mx-auto my-8 animate-[fadeIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button outside overlapping top right */}
            <button 
              onClick={() => setShowTicketModal(null)}
              className="absolute -top-4 -right-4 z-[110] bg-slate-900 text-white hover:bg-slate-800 border-2 border-slate-700 shadow-xl rounded-full w-10 h-10 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            {/* Ticket Card Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
              
              {/* Decorative notches */}
              <div className="absolute left-[-20px] top-[180px] w-10 h-10 bg-slate-900/80 dark:bg-black/80 rounded-full z-10 hidden sm:block"></div>
              <div className="absolute right-[-20px] top-[180px] w-10 h-10 bg-slate-900/80 dark:bg-black/80 rounded-full z-10 hidden sm:block"></div>
              
              {/* Ticket Header Image */}
              <div className="h-32 bg-indigo-600 relative">
                <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none"></div>

                <div className="absolute bottom-4 left-6 right-6 pointer-events-none">
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Admit One</p>
                  <h3 className="text-white text-2xl font-bold font-['Space_Grotesk'] leading-tight">{showTicketModal.title}</h3>
                </div>
              </div>
              
              {/* Ticket Info */}
              <div className="p-6 pb-8 border-b-2 border-dashed border-slate-200 dark:border-white/10 relative">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Date</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{showTicketModal.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Time</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{showTicketModal.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Location</p>
                    <p className="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">videocam</span> {showTicketModal.type}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5">
                  {/* Mock QR Code */}
                  <div className="w-32 h-32 bg-white p-2 rounded-lg mb-3 mx-auto">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MS-EVT-8921-TICKET" alt="Ticket QR Code" className="w-full h-full" />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-mono tracking-widest uppercase">MS-EVT-8921</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                <button 
                  onClick={() => alert("Mengalihkan ke aplikasi Zoom / Google Meet...")}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">login</span> Masuk ke Ruang Virtual
                </button>
                <button 
                  onClick={() => alert("Berhasil menyimpan jadwal acara ini ke Google Calendar Anda!")}
                  className="w-full py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">event</span> Simpan ke Google Calendar
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


