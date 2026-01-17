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
  loadCloudList: (listId: string) => Promise<void>;
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

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const isHydrating = useRef(true);
  const [collections, setCollections] = useState<Collection[]>([DEFAULT_COLLECTION]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('default');

  // --- 1. INITIALIZATION & SYNC LOGIC ---
  useEffect(() => {
    const initData = async () => {
        isHydrating.current = true;
        
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
                console.error("Sync failed:", err);
            }
        } 
        else {
            const saved = localStorage.getItem('tria_collections');
            if (saved) {
                try { 
                    const parsed = JSON.parse(saved);
                    setCollections(parsed);
                    setActiveCollectionId(parsed[0]?.id || 'default');
                } catch (e) { 
                    setCollections([DEFAULT_COLLECTION]);
                }
            }
        }
        isHydrating.current = false;
    };

    initData();
  }, [user]);

  // --- 2. AUTO-SAVE LOGIC ---
  useEffect(() => {
      if (isHydrating.current) return;

      const saveData = async () => {
          if (user && !user.id.startsWith('mock-')) {
              // OPTIMIZATION: Keep top 15 cast and key crew, remove rest to save DB space
              // BUT DO NOT REMOVE production_countries or runtime
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
                          // Ensure we save creators for TV
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

      const handler = setTimeout(() => {
          if (collections.length > 0) saveData();
      }, 2000); 

      return () => clearTimeout(handler);
  }, [collections, user]);

  // --- CORE ACTIONS ---

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
      setCollections(prev => {
          const filtered = prev.filter(c => c.id !== id);
          if (activeCollectionId === id && filtered.length > 0) setActiveCollectionId(filtered[0].id);
          return filtered;
      });
      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').delete().eq('id', id);
      }
      showToast('Liste silindi', 'info');
  };

  // --- CRITICAL FIX: Fetch Details on Add ---
  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    // Determine if we need to fetch details (if missing runtime or country data)
    const isTv = !!(movie.name || movie.first_air_date);
    const hasDetails = (isTv ? (movie.episode_run_time || movie.number_of_episodes) : movie.runtime) && movie.production_countries;
    
    // Check if exists first (Synchronous check)
    let exists = false;
    setCollections(prev => {
        const col = prev.find(c => c.id === activeCollectionId);
        if (col && col.movies.some(m => m.id === movie.id)) {
            exists = true;
        }
        return prev;
    });

    if (exists) {
        // REMOVE LOGIC
        setCollections(prev => prev.map(col => {
            if (col.id === activeCollectionId) {
                // Cleanup Favorites slots if removed
                let newFavMovies = col.topFavoriteMovies || [null, null, null, null, null];
                let newFavShows = col.topFavoriteShows || [null, null, null, null, null];
                if (isTv) newFavShows = newFavShows.map(id => id === movie.id ? null : id);
                else newFavMovies = newFavMovies.map(id => id === movie.id ? null : id);

                return {
                    ...col,
                    movies: col.movies.filter(m => m.id !== movie.id),
                    topFavoriteMovies: newFavMovies,
                    topFavoriteShows: newFavShows
                };
            }
            return col;
        }));
        // UX DECISION: No Toast on removal, visual state change is enough.
    } else {
        // ADD LOGIC
        
        // If missing details, fetch quietly without spamming toasts
        if (!hasDetails) {
            try {
                const tmdb = new TmdbService();
                const type = isTv ? 'tv' : 'movie';
                const details = await tmdb.getMovieDetail(movie.id, type);
                
                // Add detailed movie
                addMovieToState({ ...details, addedAt: new Date().toISOString() });
            } catch (e) {
                // Fallback add
                addMovieToState({ ...movie, addedAt: new Date().toISOString() });
            }
        } else {
            // Already has details (came from Detail View)
            addMovieToState({ ...movie, addedAt: new Date().toISOString() });
        }
        // UX DECISION: No Toast on success, visual state change (heart fill) is enough.
    }
  }, [activeCollectionId]); // Removed showToast dependency from array as it's not used in this function anymore

  const addMovieToState = (movieToAdd: Movie) => {
      setCollections(prev => prev.map(col => {
          if (col.id === activeCollectionId) {
              if (col.movies.some(m => m.id === movieToAdd.id)) return col;
              return { ...col, movies: [...col.movies, movieToAdd] };
          }
          return col;
      }));
  };

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
                  // Remove from other slots if exists
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
      const collection = collections.find(c => c.id === collectionId);
      if (!collection || !user || user.id.startsWith('mock-')) return null;

      // Strip credits for shared list to be lightweight
      const optimizedMovies = collection.movies.map(({ credits, ...rest }) => rest);

      const { data, error } = await supabase.from('shared_lists')
          .insert({ user_id: user.id, name: collection.name, movies: optimizedMovies })
          .select('id').single();
      
      return error ? null : `?list=${data.id}`;
  };

  const loadCloudList = async (listId: string) => {
      const { data } = await supabase.from('shared_lists').select('*').eq('id', listId).single();
      if (data) {
          const newCol = {
              id: `cloud-${data.id}`,
              name: data.name,
              movies: data.movies || [],
              topFavoriteMovies: [null, null, null, null, null],
              topFavoriteShows: [null, null, null, null, null]
          };
          setCollections(prev => [...prev, newCol]);
          setActiveCollectionId(newCol.id);
          showToast(`${data.name} yüklendi`, 'success');
      }
  };

  const loadSharedList = async (ids: string[]) => {
     const tmdb = new TmdbService();
     const promises = ids.slice(0, 20).map(id => tmdb.getMovieDetail(parseInt(id)));
     const res = await Promise.all(promises);
     const valid = res.filter(m => !!m).map(m => ({...m, addedAt: new Date().toISOString()}));
     const newCol = { id: `shared-${Date.now()}`, name: 'Paylaşılan', movies: valid, topFavoriteMovies: [], topFavoriteShows: [] };
     setCollections(prev => [...prev, newCol]);
     setActiveCollectionId(newCol.id);
  };

  const resetCollections = () => {
      setCollections([DEFAULT_COLLECTION]);
      setActiveCollectionId('default');
      localStorage.setItem('tria_collections', JSON.stringify([DEFAULT_COLLECTION]));
  };

  return (
    <CollectionContext.Provider value={{
        collections, activeCollectionId, setActiveCollectionId, createCollection, deleteCollection,
        toggleMovieInCollection, checkIsSelected, loadSharedList, loadCloudList, shareCollection,
        resetCollections, updateTopFavorite
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