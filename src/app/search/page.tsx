"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ArtworkCard from '@/components/ArtworkCard';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
import { useArtwork, type Artwork } from '@/context/ArtworkContext';

function SearchContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();
  
  const { artworks: allArtworks } = useArtwork();
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (query) {
        const filtered = allArtworks.filter(art =>
          art.title.toLowerCase().includes(query) ||
          art.artist.toLowerCase().includes(query) ||
          art.tags.some(tag => tag.toLowerCase().includes(query))
        );
        setFilteredArtworks(filtered);
      } else {
        setFilteredArtworks([]);
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, allArtworks]);

  return (
    <div className="max-w-7xl mx-auto py-8 animate-[fadeIn_0.3s_ease-out]">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 font-['Space_Grotesk']">
        Search Results for "{query}"
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredArtworks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredArtworks.map((item) => (
            <ArtworkCard key={item.id} artwork={item} onClick={setSelectedArtwork} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">search_off</span>
          <h2 className="text-2xl font-bold dark:text-white">No cosmic creations found</h2>
          <p className="text-slate-500 mt-2">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">search</span>
          <h2 className="text-2xl font-bold dark:text-white">Type something to search</h2>
        </div>
      )}

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          onClose={() => setSelectedArtwork(null)} 
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
