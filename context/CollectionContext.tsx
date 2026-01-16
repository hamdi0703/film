import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Collection, Movie, MediaType } from '../types';
import { useToast } from './ToastContext';
import { TmdbService } from '../services/tmdbService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface CollectionContextType {
  collections: Collection[];
  activeCollectionId: string;
  setActiveCollectionId: (id: string) => void;
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  toggleMovieInCollection: (movie: Movie) => void;
  checkIsSelected: (id: number) => boolean;
  loadSharedList: (ids: string[]) => Promise<void>;
  loadCloudList: (shareCode: string) => Promise<void>;
  shareCollection: (collectionId: string) => Promise<string | null>;
  resetCollections: () => void;
  updateTopFavorite: (slotIndex: number, movieId: number | null, type: MediaType) => void;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

const DEFAULT_COLLECTION: Collection = { 
    id: 'default', 
    name: 'Favoriler', 
    movies: [], 
    topFavoriteMovies: [null, null, null, null, null],
    topFavoriteShows: [null, null, null, null, null]
};

// HELPER: Generate XXXX-XXXX-XXXX-XXXX format
const generateShareCode = (): string => {
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'X');
    return `${part()}-${part()}-${part()}-${part()}`;
};

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Flag to prevent saving while initial fetching is happening
  const isHydrating = useRef(true);

  const [collections, setCollections] = useState<Collection[]>([DEFAULT_COLLECTION]);

  const [activeCollectionId, setActiveCollectionId] = useState<string>('default');

  // --- 1. INITIALIZATION & SYNC LOGIC ---
  useEffect(() => {
    const initData = async () => {
        isHydrating.current = true;
        
        // Scenario A: Real User Logged In -> Fetch from Supabase
        if (user && !user.id.startsWith('mock-')) {
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
                    setCollections(mapped);
                    setActiveCollectionId(mapped[0].id);
                } else {
                    setCollections([DEFAULT_COLLECTION]);
                    setActiveCollectionId('default');
                }
            } catch (err) {
                console.error("Failed to sync collections:", err);
                showToast('Veriler senkronize edilemedi.', 'error');
            }
        } 
        // Scenario B: Guest or Mock User -> Load from LocalStorage
        else {
            const saved = localStorage.getItem('vista_collections');
            if (saved) {
                try { 
                    const parsed = JSON.parse(saved);
                    const safeParsed = parsed.map((c: any) => ({
                        ...c,
                        topFavoriteMovies: c.topFavoriteMovies || c.topFavorites || [null, null, null, null, null],
                        topFavoriteShows: c.topFavoriteShows || [null, null, null, null, null]
                    }));
                    setCollections(safeParsed);
                    setActiveCollectionId(safeParsed[0]?.id || 'default');
                } catch (e) { 
                    console.error(e); 
                    setCollections([DEFAULT_COLLECTION]);
                }
            } else {
                setCollections([DEFAULT_COLLECTION]);
            }
        }
        isHydrating.current = false;
    };

    initData();
  }, [user]);

  // --- 2. PERSISTENCE LOGIC (Auto-Save) ---
  useEffect(() => {
      if (isHydrating.current) return;

      const saveData = async () => {
          // Scenario A: Real User -> Save to Supabase
          if (user && !user.id.startsWith('mock-')) {
              
              // DATA OPTIMIZATION: Stripping heavy data (credits)
              const payload = collections.map(col => ({
                  id: col.id,
                  user_id: user.id,
                  name: col.name,
                  movies: col.movies.map(m => {
                      const { credits, production_countries, ...keep } = m;
                      return {
                          ...keep,
                          credits: credits ? {
                              cast: credits.cast?.slice(0, 10).map(c => ({ 
                                  id: c.id, name: c.name, character: c.character, profile_path: c.profile_path, order: c.order 
                              })) || [],
                              crew: credits.crew?.filter(c => c.job === 'Director').map(c => ({
                                  id: c.id, name: c.name, job: c.job, department: c.department, profile_path: c.profile_path
                              })) || []
                          } : undefined,
                          created_by: m.created_by?.map(c => ({ id: c.id, name: c.name, profile_path: c.profile_path }))
                      };
                  }),
                  top_favorite_movies: col.topFavoriteMovies,
                  top_favorite_shows: col.topFavoriteShows,
                  updated_at: new Date().toISOString()
              }));

              try {
                  const { error } = await supabase
                    .from('user_collections')
                    .upsert(payload, { onConflict: 'id' });
                  
                  if (error) throw error;
              } catch (err) {
                  console.error("Auto-save failed", err);
              }
          } 
          // Scenario B: Guest -> Save to LocalStorage
          else {
              localStorage.setItem('vista_collections', JSON.stringify(collections));
          }
      };

      const handler = setTimeout(() => {
          if (collections.length > 0) saveData();
      }, 2000); 

      return () => clearTimeout(handler);

  }, [collections, user]);


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
      showToast(`"${name}" listesi oluşturuldu`, 'success');
  };

  const deleteCollection = async (id: string) => {
      setCollections(prev => {
          const filtered = prev.filter(c => c.id !== id);
          if (activeCollectionId === id && filtered.length > 0) setActiveCollectionId(filtered[0].id);
          return filtered;
      });

      if (user && !user.id.startsWith('mock-')) {
          try {
              await supabase.from('user_collections').delete().eq('id', id);
          } catch (e) { console.error("Remote delete failed", e); }
      }

      showToast('Liste silindi', 'info');
  };

  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    let action = 'added';
    const timestamp = new Date().toISOString();
    const isTv = !!(movie.name || movie.first_air_date);

    setCollections(prev => prev.map(col => {
        if (col.id === activeCollectionId) {
            const exists = col.movies.find(m => m.id === movie.id);
            if (exists) {
                action = 'removed';
                let newFavMovies = col.topFavoriteMovies || [null, null, null, null, null];
                let newFavShows = col.topFavoriteShows || [null, null, null, null, null];

                if (isTv) {
                    newFavShows = newFavShows.map(favId => favId === movie.id ? null : favId);
                } else {
                    newFavMovies = newFavMovies.map(favId => favId === movie.id ? null : favId);
                }
                
                return { 
                    ...col, 
                    movies: col.movies.filter(m => m.id !== movie.id),
                    topFavoriteMovies: newFavMovies,
                    topFavoriteShows: newFavShows
                };
            }
            else {
                const { credits, ...rest } = movie;
                const optimizedMovie = {
                    ...rest,
                    credits: credits ? {
                        cast: credits.cast?.slice(0, 10) || [],
                        crew: credits.crew?.filter(c => c.job === 'Director') || []
                    } : undefined,
                    addedAt: timestamp
                };
                return { ...col, movies: [...col.movies, optimizedMovie] };
            }
        }
        return col;
    }));

    const title = movie.title || movie.name;
    if (action === 'added') showToast(`"${title}" listeye eklendi`, 'success');
    else showToast(`"${title}" listeden çıkarıldı`, 'info');
  }, [activeCollectionId, showToast]);

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
              
              if (movieId !== null) {
                  const existingIndex = targetArray.indexOf(movieId);
                  if (existingIndex !== -1 && existingIndex !== slotIndex) {
                      targetArray[existingIndex] = null;
                  }
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

  // --- SHARING LOGIC ---

  const shareCollection = async (collectionId: string): Promise<string | null> => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection || collection.movies.length === 0) return null;

    const isMockUser = user?.id.startsWith('mock-');
    
    if (isMockUser) {
        showToast('Admin hesabıyla bulut kaydı yapılamaz.', 'error');
        return null;
    }

    if (user) {
        // Generate specific 16-char code
        const shareCode = generateShareCode();

        const optimizedMovies = collection.movies.map(m => {
             const { credits, ...rest } = m;
             return { ...rest, credits: undefined };
        });

        try {
            const { error } = await supabase
                .from('shared_lists')
                .insert({
                    user_id: user.id,
                    name: collection.name,
                    movies: optimizedMovies,
                    share_code: shareCode // Save the custom code
                });

            if (error) throw error;
            return `?list=${shareCode}`; // Return formatted code parameter
        } catch (error: any) {
            console.error("Share failed:", error);
            showToast('Paylaşım oluşturulamadı.', 'error');
        }
    }

    const ids = collection.movies.map(m => m.id).join(',');
    return `?ids=${ids}`;
  };

  const loadCloudList = async (shareCode: string) => {
      try {
          // Query by share_code column
          const { data, error } = await supabase
            .from('shared_lists')
            .select('*')
            .eq('share_code', shareCode)
            .single();

          if (error) throw error;
          if (data) {
             const newCollection: Collection = {
                id: `cloud-${data.id}`, // Internal ID can remain UUID
                name: data.name || 'Paylaşılan Liste',
                movies: data.movies || [],
                topFavoriteMovies: [null, null, null, null, null],
                topFavoriteShows: [null, null, null, null, null]
             };
             
             setCollections(prev => {
                 if (prev.some(c => c.id === newCollection.id)) return prev;
                 return [...prev, newCollection];
             });
             setActiveCollectionId(newCollection.id);
             showToast(`"${data.name}" listesi yüklendi`, 'success');
          }
      } catch (error) {
          console.error("Failed to load cloud list", error);
          showToast('Paylaşılan liste bulunamadı', 'error');
      }
  };

  const loadSharedList = async (ids: string[]) => {
      try {
        const tmdb = new TmdbService();
        const promises = ids.slice(0, 20).map(id => tmdb.getMovieDetail(parseInt(id))); 
        const results = await Promise.all(promises);
        const validMovies = results.filter(m => !!m).map(m => ({ ...m, addedAt: new Date().toISOString() }));
        
        const newCollection: Collection = {
            id: `shared-${Date.now()}`,
            name: 'Paylaşılan Liste',
            movies: validMovies,
            topFavoriteMovies: [null, null, null, null, null],
            topFavoriteShows: [null, null, null, null, null]
        };
        setCollections(prev => [...prev, newCollection]);
        setActiveCollectionId(newCollection.id);
        showToast('Paylaşılan liste başarıyla yüklendi', 'success');
    } catch (e) {
        console.error("Failed to load shared list", e);
        showToast('Liste yüklenirken hata oluştu', 'error');
    }
  };

  const resetCollections = () => {
      setCollections([DEFAULT_COLLECTION]);
      setActiveCollectionId('default');
      localStorage.setItem('vista_collections', JSON.stringify([DEFAULT_COLLECTION]));
  };

  return (
    <CollectionContext.Provider value={{
        collections,
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
        updateTopFavorite
    }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollectionContext = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollectionContext must be used within a CollectionProvider');
  }
  return context;
};