"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MasonryGrid from '@/components/MasonryGrid';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
import { useArtwork, type Artwork } from '@/context/ArtworkContext';
import { useAuth } from '@/context/AuthContext';
import ArtworkCard from '@/components/ArtworkCard';
import api from '@/lib/api';
import { UserProfileResponse } from '@/app/search/page';

const MASONRY_BREAKPOINTS = {
  default: 4,
  1536: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = Array.isArray(params?.username) ? params.username[0] : (params?.username as string);
  const decodedUsername = username ? decodeURIComponent(username) : '';
  
  const { toggleFollow } = useArtwork();
  const { isAuthenticated, showAuthModal } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [artistArtworks, setArtistArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Inappropriate');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        // 1. Find user by username using Search API
        const searchRes = await api.get(`/search?query=${encodeURIComponent(decodedUsername)}`);
        const users: UserProfileResponse[] = searchRes.data?.data?.users || [];
        const user = users.find(u => u.username.toLowerCase() === decodedUsername.toLowerCase());
        
        if (!user) {
          if (isMounted) setError("Artist not found");
          return;
        }

        // 2. Fetch full profile and artworks
        const [profileRes, artworksRes] = await Promise.all([
          api.get(`/users/${user.userId}/profile`),
          api.get(`/artwork/user/${user.userId}`)
        ]);

        if (isMounted) {
          setProfile(profileRes.data?.data || user);
          setArtistArtworks(artworksRes.data?.data?.items || []);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        if (isMounted) setError("Failed to load profile");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    if (decodedUsername) fetchProfile();
  }, [decodedUsername]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return <div className="p-8 text-center text-slate-500">Artist not found</div>;


  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Storefront Header Section */}
      <section className="mb-12 relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-64 md:h-80 w-full relative">
          <img 
            src={profile.bannerUrl || "https://res.cloudinary.com/dzpv8dz7e/image/upload/v1780888547/rrxgc4xrzgk3rtnpcytz.jpg-4.0.3&auto=format&fit=crop&w=2070&q=80"} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        </div>

        <div className="px-8 relative -mt-24 sm:-mt-28 flex flex-col sm:flex-row items-center sm:items-end gap-8 pb-10">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 z-10 text-white font-bold text-5xl">
            {profile.profileImageUrl || profile.avatarUrl ? (
              <img 
                src={profile.profileImageUrl || profile.avatarUrl} 
                alt={profile.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left z-10 pt-4 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <h1 className="text-4xl font-bold text-white font-['Space_Grotesk'] drop-shadow-md">
                  {profile.username}
                </h1>
                {(profile.firstName || profile.lastName) && (
                  <p className="text-slate-300 font-medium">{profile.firstName} {profile.lastName}</p>
                )}
              </div>
              
              {/* Primary CTA in Header */}
              <div className="flex gap-3 justify-center sm:justify-start">
                <button 
                  onClick={async () => {
                    if (!isAuthenticated) {
                      showAuthModal();
                      return;
                    }
                    await toggleFollow(profile.userId);
                    setProfile(prev => prev ? { ...prev, isFollowing: !prev.isFollowing, followerCount: (prev.followerCount || 0) + (prev.isFollowing ? -1 : 1) } : null);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${
                    profile.isFollowing
                      ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30'
                      : 'bg-white text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 transition-all shadow-lg flex items-center justify-center"
                  title="Report User"
                >
                  <span className="material-symbols-outlined text-sm">flag</span>
                </button>
              </div>
            </div>
            
            <p className="text-slate-200 text-sm sm:text-base max-w-3xl mb-4 text-shadow-sm leading-relaxed">
              {profile.bio || "Digital Illustrator & Character Designer. I love bringing original characters to life with vibrant colors and expressive poses!"}
            </p>
            
            <div className="flex justify-center sm:justify-start items-center gap-4 text-slate-300">
              <div className="flex items-center gap-1.5 text-sm font-medium bg-slate-800/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>{profile.followerCount} Followers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column: Commission Info & Reviews */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Commission Status */}
          {profile.isAcceptingCommissions && (
          <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-['Space_Grotesk'] flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">info</span>
              Commission Info
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Open for Commissions</span>
                </div>
              </div>
                <div className="flex gap-2 w-full mt-2 lg:mt-0">
                  {profile.isAcceptingCommissions && (
                    <Link href={`/commissions/request/${encodeURIComponent(profile.username)}`} className="w-full inline-flex justify-center items-center gap-2 py-3 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-slate-200 text-white rounded-xl font-bold shadow-lg transition-colors">
                      <span className="material-symbols-outlined text-lg">draw</span> Request Commission
                    </Link>
                  )}
                </div>
            </div>
          </section>
          )}
        </div>

        {/* Right Column: Packages & Portfolio */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mobile CTA */}
          {profile.isAcceptingCommissions && (
            <Link 
              href={`/commissions/request/${encodeURIComponent(profile.username)}`}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  showAuthModal();
                }
              }}
              className="mt-6 md:hidden w-full py-4 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-slate-200 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
              Request Commission
            </Link>
          )}

          {/* Artworks Grid (Portfolio) */}
          <section className="bg-transparent">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 font-['Space_Grotesk'] flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">collections_bookmark</span>
              Portfolio Gallery
            </h2>
            {artistArtworks.length > 0 ? (
              <MasonryGrid
                items={artistArtworks}
                renderItem={(item) => (
                  <div key={item.id}>
                    <ArtworkCard artwork={item} onClick={() => setSelectedArtwork(item)} />
                  </div>
                )}
              />
            ) : (
              <div className="text-center py-20 bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-3xl">
                <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500 mb-4">
                  sentiment_dissatisfied
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  No artworks found
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  This artist hasn't published anything yet.
                </p>
              </div>
            )}
          </section>

        </div>
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          onClose={() => setSelectedArtwork(null)} 
        />
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">flag</span>
                Report User
              </h3>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason for reporting</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                >
                  <option value="Spam">Spam</option>
                  <option value="Inappropriate">Inappropriate Content</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Copyright">Copyright Violation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Additional details</label>
                <textarea 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please provide more details about why you are reporting this user..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!reportReason.trim() || isSubmittingReport}
                onClick={async () => {
                  try {
                    setIsSubmittingReport(true);
                    await api.post('/reports', {
                      targetUserId: profile.userId,
                      reportType: reportType,
                      reason: reportReason
                    });
                    setIsReportModalOpen(false);
                    setReportReason('');
                    alert("Report submitted successfully.");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to submit report.");
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingReport ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
