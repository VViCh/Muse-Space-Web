import { useState } from 'react';
import { useArtwork, type Artwork } from '../context/ArtworkContext';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: (artwork: Artwork) => void;
}

export default function ArtworkCard({ artwork, onClick }: ArtworkCardProps) {
  const { toggleLike, toggleSave } = useArtwork();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectRatio = artwork.width && artwork.height ? `${artwork.width} / ${artwork.height}` : 'auto';

  // Fix Unsplash mock images by forcing them to crop to the hardcoded database dimensions
  let imageUrl = artwork.contentUrl || artwork.thumbnailUrl;
  if (imageUrl?.includes('images.unsplash.com') && artwork.width && artwork.height) {
    imageUrl += `&h=${artwork.height}&fit=crop`;
  }

  return (
    <div
      onClick={() => onClick(artwork)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800 transition-all hover:shadow-2xl w-full"
    >
      {/* Image Skeleton Loader */}
      {!isLoaded && !hasError && (
        <div style={{ aspectRatio }} className="w-full animate-pulse bg-slate-300 dark:bg-slate-700" />
      )}

      {/* Image with Right Click Protection */}
      {!hasError && (
        <img
          src={imageUrl}
          alt={artwork.title}
          className={`w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110 ${!isLoaded ? 'hidden' : 'block'}`}
          onContextMenu={(e) => e.preventDefault()}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            // Prevent synchronous state update during render for cached broken images
            setTimeout(() => setHasError(true), 0);
          }}
        />
      )}
      
      {hasError && (
        <div style={{ aspectRatio }} className="w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 p-4 text-center">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">broken_image</span>
          <p className="text-sm font-medium opacity-70 line-clamp-2 w-full px-2">{artwork.title}</p>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{artwork.title}</h3>
            <p className="text-slate-300 text-sm">{artwork.creatorUsername}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLike(artwork.id); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md ${
                artwork.isLiked 
                  ? 'bg-[#FF2257] scale-110' 
                  : 'bg-[#1e293b]/80 hover:bg-[#334155]/90'
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
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSave(artwork.id); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md ${
                artwork.isBookmarked 
                  ? 'bg-[#845EF7] scale-110' 
                  : 'bg-[#1e293b]/80 hover:bg-[#334155]/90'
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
