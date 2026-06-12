"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Masonry from 'react-masonry-css';
import MasonryGrid from '@/components/MasonryGrid';
import ArtworkCard from '@/components/ArtworkCard';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
import { useArtwork, type Artwork } from '@/context/ArtworkContext';

import TagCarousel from '@/components/TagCarousel';

const MASONRY_BREAKPOINTS = {
  default: 4,
  1536: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1
};

function HomeContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();
  const postId = searchParams.get('post');

  const { artworks: allArtworks, isLoading: isContextLoading, hasMore, isFetchingMore, fetchMoreArtworks } = useArtwork();

  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>(allArtworks);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (postId) {
      const art = allArtworks.find(a => a.id.toString() === postId);
      if (art) {
        setSelectedArtwork(art);
      }
    }
  }, [postId, allArtworks]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (query) {
        const filtered = allArtworks.filter(art =>
          art.title.toLowerCase().includes(query) ||
          art.tags?.some(tag => tag.name.toLowerCase().includes(query))
        );
        setFilteredArtworks(filtered);
      } else {
        setFilteredArtworks(allArtworks);
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allArtworks]);

  const lastArtworkRef = useCallback((node: HTMLDivElement | null) => {
    // If we're loading, fetching more, or currently searching by query, disable infinite scroll
    if (isLoading || isContextLoading || isFetchingMore || query || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchMoreArtworks();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isContextLoading, isFetchingMore, query, hasMore, fetchMoreArtworks]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <section className="mb-6">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">
          {t('home.title', 'Curated Galaxies')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {t('home.subtitle', 'Selected artwork from the outer reaches of the imagination.')}
        </p>
      </section>

      <TagCarousel />

      {query && !isLoading && (
        <div className="mb-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">search</span> Search Results for "{query}"
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"><span className="material-symbols-outlined text-indigo-500">brush</span> Artists</h3>
              <p className="text-sm text-slate-500">2 artists found</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-purple-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"><span className="material-symbols-outlined text-purple-500">group</span> Groups</h3>
              <p className="text-sm text-slate-500">1 group found</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-rose-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"><span className="material-symbols-outlined text-rose-500">event</span> Events</h3>
              <p className="text-sm text-slate-500">3 events found</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"><span className="material-symbols-outlined text-emerald-500">design_services</span> Commissions</h3>
              <p className="text-sm text-slate-500">5 available commissions</p>
            </div>
          </div>
        </div>
      )}

      {isLoading || isContextLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredArtworks.length > 0 ? (
        <div className="mb-10">
          {query && <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-xl"><span className="material-symbols-outlined text-amber-500">photo_library</span> Images</h3>}
          <MasonryGrid
            items={filteredArtworks}
            renderItem={(item, index) => (
              <div
                key={item.id}
                ref={filteredArtworks.length === index + 1 ? lastArtworkRef : null}
              >
                <ArtworkCard artwork={item} onClick={setSelectedArtwork} />
              </div>
            )}
          />

          {isFetchingMore && (
            <div className="py-10 flex justify-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold dark:text-white">{t('home.no_images_found', 'No cosmic creations found')}</h2>
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          onClose={() => {
            setSelectedArtwork(null);
            // Replace the URL to remove ?post
            window.history.replaceState(null, '', window.location.pathname);
          }} 
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
