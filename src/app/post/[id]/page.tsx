"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Artwork, useArtwork } from '@/context/ArtworkContext';
import CommentSection from '@/components/CommentSection';
import MasonryGrid from '@/components/MasonryGrid';
import ArtworkCard from '@/components/ArtworkCard';

export default function PostPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, showAuthModal } = useAuth();
  const { toggleLike: globalToggleLike, toggleSave: globalToggleSave } = useArtwork();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [similarArtworks, setSimilarArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageRetryKey, setImageRetryKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchArtwork = async () => {
      try {
        const res = await api.get(`/Artwork/${id}`);
        if (res.data?.isSuccess) {
          if (isMounted) setArtwork(res.data.data);
          
          // Fetch similar artworks
          const simRes = await api.get(`/recommendations/similar/${id}?page=1&pageSize=10`);
          if (simRes.data?.isSuccess && isMounted) {
            setSimilarArtworks(simRes.data.data.items);
          }
        } else {
          if (isMounted) setError("Artwork not found");
        }
      } catch (err) {
        if (isMounted) setError("Failed to load artwork");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchArtwork();
    return () => { isMounted = false; };
  }, [id]);

  const handleShare = () => {
    const url = `${window.location.origin}/post/${artwork?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const toggleLike = async () => {
    if (!artwork) return;
    if (!isAuthenticated) return showAuthModal();
    setArtwork(prev => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 } : null);
    globalToggleLike(artwork.id);
    try {
      await api.post(`/artworks/${artwork.id}/like`);
    } catch {
      setArtwork(prev => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 } : null);
      globalToggleLike(artwork.id);
    }
  };

  const toggleSave = async () => {
    if (!artwork) return;
    if (!isAuthenticated) return showAuthModal();
    setArtwork(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    globalToggleSave(artwork.id);
    try {
      await api.post(`/artworks/${artwork.id}/bookmark`);
    } catch {
      setArtwork(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
      globalToggleSave(artwork.id);
    }
  };

  const toggleFollow = async () => {
    if (!artwork) return;
    if (!isAuthenticated) return showAuthModal();
    setArtwork(prev => prev ? { ...prev, isFollowingCreator: !prev.isFollowingCreator } : null);
    try {
      await api.post(`/users/${artwork.creatorId}/follow`);
    } catch {
      setArtwork(prev => prev ? { ...prev, isFollowingCreator: !prev.isFollowingCreator } : null);
    }
  };

  const handleDelete = async () => {
    if (!artwork) return;
    if (!window.confirm("Are you sure you want to delete this artwork?")) return;
    try {
      const res = await api.delete(`/Artwork/${artwork.id}`);
      if (res.data?.isSuccess) {
        window.alert("Artwork deleted successfully.");
        router.push('/');
      } else {
        window.alert("Failed to delete artwork.");
      }
    } catch (err) {
      window.alert("An error occurred while deleting.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">broken_image</span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{error || "Not found"}</h1>
          <Link href="/" className="text-indigo-500 hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pb-20">
      {/* Immersive Image Header */}
      <div className="w-full bg-black relative flex justify-center items-center overflow-hidden min-h-[50vh] max-h-[85vh]">
        {/* Blurred background for cinematic feel */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 transition-opacity duration-700" 
          style={{ 
            backgroundImage: `url(${artwork.thumbnailUrl || artwork.contentUrl})`,
            opacity: imageLoaded ? 0.4 : 0.1 
          }}
        ></div>

        {/* Skeleton while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-0">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Image Error State */}
        {imageError && (
          <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl">
            <span className="material-symbols-outlined text-6xl text-slate-500 mb-4">broken_image</span>
            <p className="text-white font-medium mb-6 text-lg">Failed to load high-resolution image</p>
            <button 
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
                setImageRetryKey(prev => prev + 1);
              }}
              className="px-6 py-2.5 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span> Retry Loading
            </button>
          </div>
        )}

        {!imageError && (
          <img
            key={imageRetryKey}
            src={artwork.contentUrl || artwork.thumbnailUrl}
            alt={artwork.title}
            className={`relative z-10 max-w-full max-h-[85vh] object-contain drop-shadow-2xl transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Floating Actions on Image */}
        <div className="absolute right-6 bottom-6 z-20 flex flex-col gap-3">
           <button 
             onClick={toggleLike}
             className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-xl ${
               artwork.isLiked ? 'bg-rose-500 scale-110' : 'bg-black/40 hover:bg-black/60'
             }`}
           >
             <span className={`material-symbols-outlined text-3xl ${artwork.isLiked ? 'font-solid fill-current' : ''}`}>favorite</span>
           </button>
           <button 
             onClick={toggleSave}
             className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-xl ${
               artwork.isBookmarked ? 'bg-indigo-500 scale-110' : 'bg-black/40 hover:bg-black/60'
             }`}
           >
             <span className={`material-symbols-outlined text-3xl ${artwork.isBookmarked ? 'font-solid fill-current' : ''}`}>bookmark</span>
           </button>
           <button 
             onClick={handleShare}
             className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-xl ${
               isCopied ? 'bg-emerald-500' : 'bg-black/40 hover:bg-black/60'
             }`}
           >
             <span className="material-symbols-outlined text-3xl">{isCopied ? 'check' : 'share'}</span>
           </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 xl:px-8 py-12 flex flex-col lg:flex-row gap-12">
        {/* Main Content Info */}
        <div className="flex-1 lg:w-2/3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-white/5 mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 font-['Space_Grotesk'] leading-tight">
              {artwork.title}
            </h1>
            
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <Link href={`/profile/${encodeURIComponent(artwork.creatorUsername)}`} className="flex items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-md">
                  {artwork.creatorProfileImageUrl ? (
                    <img 
                      src={artwork.creatorProfileImageUrl} 
                      alt={artwork.creatorUsername} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerText = artwork.creatorUsername.charAt(0).toUpperCase();
                        }
                      }} 
                    />
                  ) : (
                    artwork.creatorUsername.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl dark:text-white group-hover:text-indigo-500 transition-colors">
                    {artwork.creatorUsername}
                  </h3>
                  <p className="text-slate-500 text-sm">Artist</p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                {user?.id === artwork.creatorId ? (
                  <button 
                    onClick={handleDelete}
                    className="px-6 py-2.5 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Delete
                  </button>
                ) : (
                  <button 
                    onClick={toggleFollow}
                    className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                      artwork.isFollowingCreator 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                        : 'bg-indigo-600  text-white shadow-indigo-500/20'
                    }`}
                  >
                    {artwork.isFollowingCreator ? 'Following' : 'Follow Artist'}
                  </button>
                )}
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed mb-8">
              {artwork.description || <span className="text-slate-400 italic">No description provided.</span>}
            </div>

            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100 dark:border-white/5">
              {artwork.tags?.map(tag => (
                <Link 
                  key={tag.id} 
                  href={`/?q=${encodeURIComponent(tag.name)}`}
                  className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-indigo-50 dark:/30 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-white/5"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Similar Artworks Grid */}
          {similarArtworks.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 font-['Space_Grotesk'] dark:text-white">
                <span className="material-symbols-outlined text-indigo-500">auto_awesome</span> 
                More from {artwork.creatorUsername} & Others
              </h3>
              <MasonryGrid 
                items={similarArtworks}
                renderItem={(item) => (
                  <div key={item.id} className="cursor-pointer">
                    <ArtworkCard artwork={item} onClick={() => router.push(`/post/${item.id}`)} />
                  </div>
                )}
              />
            </div>
          )}
        </div>

        {/* Sidebar: Comments */}
        <div className="lg:w-1/3 flex flex-col">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span>
              Comments
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <CommentSection artworkId={artwork.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
