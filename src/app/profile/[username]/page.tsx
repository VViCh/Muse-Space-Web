"use client";
import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { useArtwork, type Artwork } from '@/context/ArtworkContext';
import ArtworkCard from '@/components/ArtworkCard';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
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
  const username = Array.isArray(params?.username) ? params.username[0] : (params?.username as string);
  const decodedUsername = username ? decodeURIComponent(username) : '';
  
  const { toggleFollow } = useArtwork();

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [artistArtworks, setArtistArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Mock commission data
  const commissionInfo = {
    status: "Open for Commissions",
    queue: "2 slots available (3 in progress)",
    estimatedDelivery: "7 - 14 days",
    styles: ["Anime", "Semi-realism", "Chibi", "Character Design"],
    priceList: [
      { type: "Bust Up", startingPrice: "$25", description: "Head to shoulders, full color & detailed shading." },
      { type: "Half Body", startingPrice: "$40", description: "Waist up, dynamic pose with simple background." },
      { type: "Full Body", startingPrice: "$60", description: "Full character illustration, complex details." }
    ],
    terms: [
      "Payment upfront via PayPal or Bank Transfer.",
      "Maximum 3 major revisions during sketch phase.",
      "Personal use only unless commercial rights are purchased (+50%).",
      "No NSFW, mecha, or heavy gore."
    ]
  };

  // Mock reviews
  const reviews = [
    { id: 1, user: "Alex T.", rating: 5, comment: "Amazing work! The details are exactly what I wanted. Super fast delivery too.", date: "2 weeks ago" },
    { id: 2, user: "Sarah M.", rating: 5, comment: "Very communicative and captured my character's personality perfectly. Highly recommend!", date: "1 month ago" },
    { id: 3, user: "Jordan K.", rating: 5, comment: "Absolutely stunning art style. Will definitely commission again in the future.", date: "2 months ago" }
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Storefront Header Section */}
      <section className="mb-12 relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-64 md:h-80 w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
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
                  onClick={() => toggleFollow(profile.userId)}
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${
                    profile.isFollowing
                      ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30'
                      : 'bg-white text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
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
          
          {/* Commission Status & ToS */}
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
                  <span className="font-bold text-slate-800 dark:text-slate-200">{commissionInfo.status}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Queue & Delivery</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">{commissionInfo.queue}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {commissionInfo.estimatedDelivery} turnaround
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Art Styles</p>
                <div className="flex flex-wrap gap-2">
                  {commissionInfo.styles.map((style, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10">
                      {style}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-sm">gavel</span>
                  Terms of Service
                </h3>
                <ul className="space-y-3">
                  {commissionInfo.terms.map((term, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="material-symbols-outlined text-indigo-500 text-base shrink-0">check</span>
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Reviews & Ratings */}
          <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">star</span>
                Reviews
              </h2>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">4.9/5.0</span>
            </div>
            
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{review.user}</p>
                      <div className="flex text-yellow-400 text-xs">
                        {"★".repeat(review.rating)}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{review.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Packages & Portfolio */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Commission Catalog (Price List) */}
          <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-6 md:p-8 rounded-3xl shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk'] flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">storefront</span>
                  Commission Catalog
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Choose a package that fits your needs.</p>
              </div>
              
              <Link href={`/commissions/request/${encodeURIComponent(profile.username)}`}
                className="hidden md:flex px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                Commission Me
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {commissionInfo.priceList.map((item, i) => (
                <div key={i} className="flex flex-col p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-2">{item.type}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">{item.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Starting from</span>
                    <span className="font-black text-3xl text-indigo-600 dark:text-indigo-400">{item.startingPrice}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile CTA */}
            <Link href={`/commissions/request/${encodeURIComponent(profile.username)}`}
              className="mt-6 md:hidden w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
              Commission Me
            </Link>
          </section>

          {/* Artworks Grid (Portfolio) */}
          <section className="bg-transparent">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 font-['Space_Grotesk'] flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">collections_bookmark</span>
              Portfolio Gallery
            </h2>
            {artistArtworks.length > 0 ? (
              <Masonry
                breakpointCols={MASONRY_BREAKPOINTS}
                className="flex w-auto gap-4"
                columnClassName="flex flex-col gap-4"
              >
                {artistArtworks.map((item, index) => (
                  <div key={item.id}>
                    <ArtworkCard artwork={item} onClick={setSelectedArtwork} />
                  </div>
                ))}
              </Masonry>
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

      {/* Detail Modal Overlay */}
      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          onClose={() => setSelectedArtwork(null)} 
        />
      )}
    </div>
  );
}






