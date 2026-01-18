import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Collection, Movie, MediaType } from '../types';
import { useToast } from './ToastContext';
import { TmdbService } from '../services/tmdbService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface CollectionContextType {
  collections: Collection[];
  sharedList: Collection | null;
  activeCollectionId: string;
  setActiveCollectionId: (id: string) => void;
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  toggleMovieInCollection: (movie: Movie) => void;
  checkIsSelected: (id: number) => boolean;
  loadSharedList: (ids: string[]) => Promise<void>;
  loadCloudList: (listId: string) => Promise<boolean>;
  shareCollection: (collectionId: string) => Promise<string | null>;
  resetCollections: () => void;
  updateTopFavorite: (slotIndex: number, movieId: number | null, type: MediaType) => void;
  exitSharedMode: () => void;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

const DEFAULT_COLLECTION: Collection = { 
    id: 'default', 
    name: 'Favoriler', 
    movies: [], 
    topFavoriteMovies: [null, null, null, null, null],
    topFavoriteShows: [null, null, null, null, null]
};

// HELPER: 16 Haneli (4-4-4-4) Rastgele Kod Üretici
const generateUniqueShareId = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; 
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.match(/.{1,4}/g)?.join('-') || result;
};

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [collections, setCollections] = useState<Collection[]>([DEFAULT_COLLECTION]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('default');
  const [sharedList, setSharedList] = useState<Collection | null>(null);

  // Refs for logic control
  const isHydrating = useRef(false); 
  const processedUserId = useRef<string | null>(null); // To prevent double-fetch for same user

  // --- 1. ROBUST INITIALIZATION ---
  useEffect(() => {
    // Auth yükleniyorsa bekle
    if (authLoading) return;

    // Aynı kullanıcı için tekrar tekrar çalışma (Duplicate önlemi)
    const currentUserId = user?.id || 'guest';
    if (processedUserId.current === currentUserId) return;
    
    const initData = async () => {
        isHydrating.current = true;
        processedUserId.current = currentUserId;

        if (user && !user.id.startsWith('mock-')) {
            // --- LOGGED IN USER ---
            try {
                const { data, error } = await supabase
                    .from('user_collections')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;

                if (data && data.length > 0) {
                    const mapped: Collection[] = data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        movies: d.movies || [],
                        topFavoriteMovies: d.top_favorite_movies || [null, null, null, null, null],
                        topFavoriteShows: d.top_favorite_shows || [null, null, null, null, null]
                    }));

                    // DUPLICATE TEMİZLİĞİ: ID'ye göre benzersiz hale getir
                    const uniqueCollections = Array.from(new Map(mapped.map(item => [item.id, item])).values());
                    
                    setCollections(uniqueCollections);
                    
                    // Aktif ID'nin geçerli olup olmadığını kontrol et
                    if (!uniqueCollections.find(c => c.id === activeCollectionId)) {
                        setActiveCollectionId(uniqueCollections[0].id);
                    }
                } else {
                    // Kullanıcı giriş yapmış ama listesi yoksa default oluştur
                    // Bunu DB'ye de kaydetmek gerekebilir ama şimdilik state'te tutuyoruz
                    setCollections([DEFAULT_COLLECTION]);
                    setActiveCollectionId('default');
                }
            } catch (err) {
                console.error("Sync failed:", err);
                // Hata durumunda boş kalmasın
                setCollections([DEFAULT_COLLECTION]);
            }
        } 
        else {
            // --- GUEST USER ---
            const saved = localStorage.getItem('tria_collections');
            if (saved) {
                try { 
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        // Validate Guest Data
                        const validData = parsed.map((c: any) => ({
                            ...DEFAULT_COLLECTION, // Ensure shape
                            ...c
                        }));
                        setCollections(validData);
                        setActiveCollectionId(validData[0]?.id || 'default');
                    } else {
                        setCollections([DEFAULT_COLLECTION]);
                    }
                } catch (e) { 
                    setCollections([DEFAULT_COLLECTION]);
                }
            } else {
                setCollections([DEFAULT_COLLECTION]);
            }
        }
        
        // Veri yüklendikten kısa bir süre sonra flag'i kaldır
        setTimeout(() => {
            isHydrating.current = false;
        }, 500);
    };

    initData();
  }, [user, authLoading]); // activeCollectionId'yi dependency olarak ekleme!

  // --- 2. AUTO-SAVE LOGIC ---
  useEffect(() => {
      if (authLoading || isHydrating.current) return;
      if (collections.length === 0) return;

      const saveData = async () => {
          if (user && !user.id.startsWith('mock-')) {
              const payload = collections.map(col => ({
                  id: col.id,
                  user_id: user.id,
                  name: col.name,
                  movies: col.movies.map(m => {
                      const { credits, ...keep } = m;
                      return {
                          ...keep,
                          credits: credits ? {
                              cast: credits.cast?.slice(0, 15) || [],
                              crew: credits.crew?.filter(c => ['Director', 'Writer'].includes(c.job)) || []
                          } : undefined,
                          created_by: m.created_by
                      };
                  }),
                  top_favorite_movies: col.topFavoriteMovies,
                  top_favorite_shows: col.topFavoriteShows,
                  updated_at: new Date().toISOString()
              }));

              try {
                  await supabase.from('user_collections').upsert(payload, { onConflict: 'id' });
              } catch (err) {
                  console.error("Auto-save failed", err);
              }
          } 
          else {
              localStorage.setItem('tria_collections', JSON.stringify(collections));
          }
      };

      const handler = setTimeout(saveData, 2000); // Debounce
      return () => clearTimeout(handler);
  }, [collections, user, authLoading]);

  // --- ACTIONS ---

  const createCollection = (name: string) => {
      const newCol: Collection = { 
          id: `col-${Date.now()}`, 
          name: name, 
          movies: [],
          topFavoriteMovies: [null, null, null, null, null],
          topFavoriteShows: [null, null, null, null, null]
      };
      setCollections(prev => [...prev, newCol]);
      setActiveCollectionId(newCol.id);
      showToast(`"${name}" oluşturuldu`, 'success');
  };

  const deleteCollection = async (id: string) => {
      if (collections.length <= 1) {
          showToast('En az bir liste kalmalıdır.', 'error');
          return;
      }
      
      setCollections(prev => {
          const filtered = prev.filter(c => c.id !== id);
          // Eğer silinen liste aktifse, ilk listeye geç
          if (activeCollectionId === id) {
             setActiveCollectionId(filtered[0].id);
          }
          return filtered;
      });

      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').delete().eq('id', id);
      }
      showToast('Liste silindi', 'info');
  };

  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    // 1. Check if movie exists in current active collection
    const targetCol = collections.find(c => c.id === activeCollectionId);
    if (!targetCol) return;

    const exists = targetCol.movies.some(m => m.id === movie.id);

    // 2. Optimistic Update
    setCollections(prev => prev.map(col => {
        if (col.id === activeCollectionId) {
            if (exists) {
                // Remove
                return {
                    ...col,
                    movies: col.movies.filter(m => m.id !== movie.id),
                    // Also remove from favorites slots if present
                    topFavoriteMovies: (col.topFavoriteMovies || []).map(mid => mid === movie.id ? null : mid),
                    topFavoriteShows: (col.topFavoriteShows || []).map(mid => mid === movie.id ? null : mid),
                };
            } else {
                // Add
                // If it's a minimal movie object, try to fetch details later, but for now add what we have
                return { ...col, movies: [...col.movies, { ...movie, addedAt: new Date().toISOString() }] };
            }
        }
        return col;
    }));

    // 3. Fetch full details if adding and missing data (Silent background update)
    if (!exists) {
        const isTv = !!(movie.name || movie.first_air_date);
        const hasDetails = (isTv ? (movie.episode_run_time || movie.number_of_episodes) : movie.runtime) && movie.production_countries;
        
        if (!hasDetails) {
            try {
                const tmdb = new TmdbService();
                const type = isTv ? 'tv' : 'movie';
                const details = await tmdb.getMovieDetail(movie.id, type);
                
                // Update state with full details
                setCollections(prev => prev.map(col => {
                    if (col.id === activeCollectionId) {
                        return {
                            ...col,
                            movies: col.movies.map(m => m.id === movie.id ? { ...details, addedAt: m.addedAt } : m)
                        };
                    }
                    return col;
                }));
            } catch (e) {
                // Ignore error, keep basic data
            }
        }
    }
  }, [activeCollectionId, collections]); // Added collections to dependency for checking existence

  const checkIsSelected = useCallback((id: number) => {
      const activeCollection = collections.find(c => c.id === activeCollectionId);
      return activeCollection ? activeCollection.movies.some(m => m.id === id) : false;
  }, [collections, activeCollectionId]);

  const updateTopFavorite = useCallback((slotIndex: number, movieId: number | null, type: MediaType) => {
      setCollections(prev => prev.map(col => {
          if (col.id === activeCollectionId) {
              const targetArray = type === 'tv' 
                ? [...(col.topFavoriteShows || [null, null, null, null, null])]
                : [...(col.topFavoriteMovies || [null, null, null, null, null])];
              
              // Remove if already in another slot
              if (movieId !== null) {
                  const existingIdx = targetArray.indexOf(movieId);
                  if (existingIdx !== -1 && existingIdx !== slotIndex) targetArray[existingIdx] = null;
              }
              
              targetArray[slotIndex] = movieId;
              
              return { 
                  ...col, 
                  topFavoriteMovies: type === 'movie' ? targetArray : col.topFavoriteMovies,
                  topFavoriteShows: type === 'tv' ? targetArray : col.topFavoriteShows
              };
          }
          return col;
      }));
  }, [activeCollectionId]);

  // --- SHARE & LOAD ---
  const shareCollection = async (collectionId: string): Promise<string | null> => {
      if (!user) {
          showToast('Liste paylaşmak için giriş yapmalısınız.', 'info');
          return null;
      }

      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return null;

      const shareId = generateUniqueShareId();
      const optimizedMovies = collection.movies.map(({ credits, ...rest }) => rest);

      const { error } = await supabase.from('shared_lists')
          .insert({ 
              id: shareId,
              user_id: user.id, 
              name: collection.name, 
              movies: optimizedMovies 
          });
      
      if (error) {
          console.error("Share error:", error);
          return null;
      }
      return `?list=${shareId}`;
  };

  const loadCloudList = async (listId: string): Promise<boolean> => {
      setSharedList(null); // Reset first

      const { data, error } = await supabase
          .from('shared_lists')
          .select('*')
          .eq('id', listId)
          .single();

      if (data && !error) {
          const shared: Collection = {
              id: `shared-${data.id}`,
              name: data.name,
              movies: data.movies || [],
              topFavoriteMovies: [],
              topFavoriteShows: []
          };
          setSharedList(shared);
          return true;
      }
      return false;
  };

  const loadSharedList = async (ids: string[]) => {
     setSharedList(null);
     const tmdb = new TmdbService();
     const promises = ids.slice(0, 20).map(id => tmdb.getMovieDetail(parseInt(id)));
     const res = await Promise.all(promises);
     const valid = res.filter(m => !!m).map(m => ({...m, addedAt: new Date().toISOString()}));
     
     const shared: Collection = { 
         id: `shared-legacy`, 
         name: 'Paylaşılan Liste', 
         movies: valid, 
         topFavoriteMovies: [], 
         topFavoriteShows: [] 
     };
     setSharedList(shared);
  };

  const exitSharedMode = () => {
      setSharedList(null);
  };

  const resetCollections = () => {
      setCollections([DEFAULT_COLLECTION]);
      setActiveCollectionId('default');
      setSharedList(null);
      processedUserId.current = null; // Reset initialization lock
      localStorage.setItem('tria_collections', JSON.stringify([DEFAULT_COLLECTION]));
  };

  return (
    <CollectionContext.Provider value={{
        collections, 
        sharedList, 
        activeCollectionId, 
        setActiveCollectionId, 
        createCollection, 
        deleteCollection,
        toggleMovieInCollection, 
        checkIsSelected, 
        loadSharedList, 
        loadCloudList, 
        shareCollection,
        resetCollections, 
        updateTopFavorite,
        exitSharedMode
    }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollectionContext = () => {
  const context = useContext(CollectionContext);
  if (!context) throw new Error('useCollectionContext must be used within a CollectionProvider');
  return context;
};