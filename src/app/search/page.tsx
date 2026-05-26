"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ArtworkCard from '@/components/ArtworkCard';
import ArtworkDetailModal from '@/components/ArtworkDetailModal';
import { type Artwork } from '@/context/ArtworkContext';
import api from '@/lib/api';

export interface UserProfileResponse {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  profileImageUrl: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  followerCount?: number;
  isAcceptingCommissions?: boolean;
}

export interface TagResponse {
  id: number;
  name: string;
}

export interface SearchResponse {
  artworks: Artwork[];
  users: UserProfileResponse[];
  tags: TagResponse[];
}

function SearchContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();
  
  const [searchResults, setSearchResults] = useState<SearchResponse>({ artworks: [], users: [], tags: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSearch = async () => {
      if (!query) {
        if (isMounted) {
          setSearchResults({ artworks: [], users: [], tags: [] });
          setIsLoading(false);
        }
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await api.get(`/search?query=${encodeURIComponent(query)}`);
        if (isMounted && response.data?.isSuccess) {
          setSearchResults(response.data.data);
        }
      } catch (err) {
        console.error("Search failed", err);
        if (isMounted) {
          setSearchResults({ artworks: [], users: [], tags: [] });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSearch();
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

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
      ) : searchResults.artworks.length > 0 || searchResults.users.length > 0 ? (
        <div className="space-y-12">
          {searchResults.users.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">group</span> Artists
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
                {searchResults.users.map(user => (
                  <div key={user.id} className="min-w-[200px] bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-4 overflow-hidden">
                      {user.profileImageUrl ? <img src={user.profileImageUrl} alt={user.username} className="w-full h-full object-cover" /> : user.username.charAt(0)}
                    </div>
                    <h3 className="font-bold dark:text-white group-hover:text-indigo-500 transition-colors truncate">{user.username}</h3>
                    <p className="text-sm text-slate-500 truncate">{user.firstName} {user.lastName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.artworks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">photo_library</span> Artworks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.artworks.map((item) => (
                  <ArtworkCard key={item.id} artwork={item} onClick={setSelectedArtwork} />
                ))}
              </div>
            </div>
          )}
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
