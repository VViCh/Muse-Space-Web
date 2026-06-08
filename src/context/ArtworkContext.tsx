import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface Tag {
  id: number;
  name: string;
}

export interface Artwork {
  id: number;
  title: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
  mediaType: string;
  width?: number;
  height?: number;
  creatorId: number;
  creatorUsername: string;
  creatorProfileImageUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowingCreator: boolean;
  tags: Tag[];
}

interface ArtworkContextType {
  artworks: Artwork[];
  isLoading: boolean;
  fetchArtworks: () => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
  toggleSave: (id: number) => Promise<void>;
  toggleFollow: (artistId: number) => Promise<void>;
}

const ArtworkContext = createContext<ArtworkContextType | undefined>(undefined);

export function ArtworkProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchArtworks = async () => {
    setIsLoading(true);
    try {
      // Fetch from Feed API (Home feed usually)
      const response = await api.get('/feed');
      // If it's a paginated response like ArtworkFeedResponse
      if (response.data?.isSuccess && response.data?.data?.items) {
        setArtworks(response.data.data.items);
      } else {
        // Fallback or empty
        setArtworks([]);
      }
    } catch (error) {
      console.error("Failed to fetch artworks", error);
      setArtworks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, [isAuthenticated]); // Refetch if auth state changes (to get correct isLiked flags)

  const toggleLike = async (id: number) => {
    // Optimistic UI Update
    setArtworks(prev => prev.map(art => art.id === id ? { ...art, isLiked: !art.isLiked, likeCount: art.isLiked ? art.likeCount - 1 : art.likeCount + 1 } : art));
    try {
      await api.post(`/artworks/${id}/like`);
    } catch (e) {
      // Revert on failure
      setArtworks(prev => prev.map(art => art.id === id ? { ...art, isLiked: !art.isLiked, likeCount: art.isLiked ? art.likeCount - 1 : art.likeCount + 1 } : art));
    }
  };

  const toggleSave = async (id: number) => {
    // Optimistic UI Update
    setArtworks(prev => prev.map(art => art.id === id ? { ...art, isBookmarked: !art.isBookmarked } : art));
    try {
      await api.post(`/artworks/${id}/bookmark`);
    } catch (e) {
      // Revert
      setArtworks(prev => prev.map(art => art.id === id ? { ...art, isBookmarked: !art.isBookmarked } : art));
    }
  };

  const toggleFollow = async (artistId: number) => {
    // Optimistic UI Update across all artworks by this artist
    setArtworks(prev => prev.map(art => art.creatorId === artistId ? { ...art, isFollowingCreator: !art.isFollowingCreator } : art));
    try {
      await api.post(`/users/${artistId}/follow`);
    } catch (e) {
      // Revert
      setArtworks(prev => prev.map(art => art.creatorId === artistId ? { ...art, isFollowingCreator: !art.isFollowingCreator } : art));
    }
  };

  return (
    <ArtworkContext.Provider value={{ artworks, isLoading, fetchArtworks, toggleLike, toggleSave, toggleFollow }}>
      {children}
    </ArtworkContext.Provider>
  );
}

export function useArtwork() {
  const context = useContext(ArtworkContext);
  if (context === undefined) {
    throw new Error('useArtwork must be used within an ArtworkProvider');
  }
  return context;
}
