import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useArtwork, type Artwork } from '../context/ArtworkContext';
import CommentSection from './CommentSection';

interface ArtworkDetailModalProps {
  artwork: Artwork;
  onClose: () => void;
}

export default function ArtworkDetailModal({ artwork, onClose }: ArtworkDetailModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toggleLike, toggleSave, toggleFollow } = useArtwork();
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/?post=${artwork.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full flex flex-col lg:flex-row overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Image Section */}
        <div className="lg:w-2/3 bg-black flex items-center justify-center p-2">
          <img
            src={artwork.contentUrl || artwork.thumbnailUrl}
            alt={artwork.title}
            className="max-w-full max-h-[80vh] object-contain shadow-2xl"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Sidebar Details Section */}
        <div className="lg:w-1/3 p-8 flex flex-col bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
              {artwork.creatorProfileImageUrl ? (
                <img src={artwork.creatorProfileImageUrl} alt={artwork.creatorUsername} className="w-full h-full object-cover" />
              ) : (
                artwork.creatorUsername?.charAt(0) || 'A'
              )}
            </div>
            <div>
              <h3 
                className="font-bold text-xl dark:text-white cursor-pointer hover:text-indigo-500 transition-colors"
                onClick={() => {
                  onClose();
                  router.push(`/profile/${encodeURIComponent(artwork.creatorUsername)}`);
                }}
              >
                {artwork.creatorUsername}
              </h3>
              <button 
                onClick={() => toggleFollow(artwork.creatorId)}
                className={`font-medium text-sm transition-colors mt-1 ${
                  artwork.isFollowingCreator 
                    ? 'text-slate-500 dark:text-slate-400' 
                    : 'text-indigo-500 hover:underline'
                }`}
              >
                {artwork.isFollowingCreator ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <h2 className="text-3xl font-bold dark:text-white mb-4 leading-tight">{artwork.title}</h2>
          {artwork.description && <p className="text-slate-600 dark:text-slate-400 mb-6">{artwork.description}</p>}
          <div className="flex flex-wrap gap-2 mb-8">
            {artwork.tags?.map(tag => (
              <span 
                key={tag.id} 
                onClick={() => {
                  onClose();
                  router.push(`/?q=${encodeURIComponent(tag.name)}`);
                }}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-full text-sm font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                #{tag.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-auto">
            <button 
              onClick={() => toggleLike(artwork.id)}
              className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                artwork.isLiked
                  ? 'bg-[#FF2257] text-white'
                  : 'bg-[#1e293b] text-white'
              }`}
            >
              {artwork.isLiked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
              {t('artwork.action_like', 'Like')}
            </button>
            <button 
              onClick={() => toggleSave(artwork.id)}
              className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                artwork.isBookmarked
                  ? 'bg-[#845EF7] text-white'
                  : 'bg-[#1e293b] text-white'
              }`}
            >
              {artwork.isBookmarked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              )}
              {t('artwork.action_save', 'Save')}
            </button>
            <button 
              onClick={handleShare}
              className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                isCopied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#1e293b] text-white hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isCopied ? 'check' : 'share'}
              </span>
              {isCopied ? 'Copied' : t('artwork.action_share', 'Share')}
            </button>
          </div>

          {/* Comments Section */}
          <CommentSection artworkId={artwork.id} />
        </div>
      </div>
    </div>
  );
}
