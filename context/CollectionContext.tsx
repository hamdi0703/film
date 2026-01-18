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

  const isHydrating = useRef(false); 
  const processedUserId = useRef<string | null>(null);

  // --- 1. USER DATA INITIALIZATION ---
  useEffect(() => {
    if (authLoading) return;
    const currentUserId = user?.id || 'guest';
    
    if (processedUserId.current === currentUserId) return;
    
    const initUserData = async () => {
        isHydrating.current = true;
        processedUserId.current = currentUserId;

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
                    if (!mapped.find(c => c.id === activeCollectionId)) {
                        setActiveCollectionId(mapped[0].id);
                    }
                } else {
                    setCollections([DEFAULT_COLLECTION]);
                    setActiveCollectionId('default');
                }
            } catch (err) {
                console.error("User sync failed:", err);
                setCollections([DEFAULT_COLLECTION]);
            }
        } else {
            const saved = localStorage.getItem('tria_collections');
            if (saved) {
                try { 
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setCollections(parsed);
                        setActiveCollectionId(parsed[0]?.id || 'default');
                    }
                } catch (e) { 
                    setCollections([DEFAULT_COLLECTION]);
                }
            }
        }
        setTimeout(() => { isHydrating.current = false; }, 500);
    };

    initUserData();
  }, [user, authLoading]);

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
                      return m;
                  }),
                  top_favorite_movies: col.topFavoriteMovies,
                  top_favorite_shows: col.topFavoriteShows,
                  updated_at: new Date().toISOString()
              }));
              try {
                  await supabase.from('user_collections').upsert(payload, { onConflict: 'id' });
              } catch (err) { console.error("Auto-save failed", err); }
          } else {
              localStorage.setItem('tria_collections', JSON.stringify(collections));
          }
      };
      const handler = setTimeout(saveData, 2000);
      return () => clearTimeout(handler);
  }, [collections, user, authLoading]);

  // --- 3. SHARED LIST LOGIC ---
  
  const loadCloudList = useCallback(async (listId: string): Promise<boolean> => {
      setSharedList(null);

      try {
          // 1. Listeyi Çek
          const { data: listData, error: listError } = await supabase
              .from('shared_lists')
              .select('*')
              .eq('id', listId)
              .single();

          if (listError || !listData) {
              console.error("List fetch error:", listError);
              return false;
          }

          // 2. Kullanıcı Adını Çek (Owner Username) - Fail-Safe
          let ownerUsername = 'Anonim';
          try {
              if (listData.user_id) {
                  const { data: profileData } = await supabase
                      .from('profiles')
                      .select('username')
                      .eq('id', listData.user_id)
                      .maybeSingle(); 
                  
                  if (profileData && profileData.username) {
                      ownerUsername = profileData.username;
                  }
              }
          } catch (e) {
              console.warn("Could not fetch owner profile, defaulting to Anonim", e);
          }

          // Ensure movies is an array
          const moviesArray = Array.isArray(listData.movies) ? listData.movies : [];

          const shared: Collection = {
              id: `shared-view-${listData.id}`,
              name: listData.name,
              owner: ownerUsername, // Set owner name
              movies: moviesArray,
              topFavoriteMovies: listData.top_favorite_movies || [null, null, null, null, null],
              topFavoriteShows: listData.top_favorite_shows || [null, null, null, null, null]
          };
          setSharedList(shared);
          return true;
      } catch (e) {
          console.error("Shared load global exception:", e);
          return false;
      }
  }, []);

  const loadSharedList = useCallback(async (ids: string[]) => {
     setSharedList(null);
     try {
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
     } catch (e) {
         console.error("Legacy load error", e);
     }
  }, []);

  const shareCollection = async (collectionId: string): Promise<string | null> => {
      if (!user) {
          showToast('Liste paylaşmak için giriş yapmalısınız.', 'info');
          return null;
      }
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return null;

      const shareId = generateUniqueShareId();
      const tmdb = new TmdbService();

      // --- CRITICAL UPDATE: ENRICH DATA BEFORE SHARING ---
      // Eğer filmler arama sayfasından eklenmişse 'credits' bilgisi eksiktir.
      // Paylaşmadan önce eksik verileri tamamlıyoruz (Hydration).
      
      const enrichedMovies = await Promise.all(collection.movies.map(async (movie) => {
          // Eğer zaten credits ve cast verisi doluysa olduğu gibi kullan
          if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
              return movie;
          }

          // Veri eksikse API'den çek
          try {
             // TV mi Film mi olduğunu anlamaya çalış
             const isTv = !!(movie.name || movie.first_air_date);
             const type = isTv ? 'tv' : 'movie';
             
             // Detay isteği at
             const fullDetails = await tmdb.getMovieDetail(movie.id, type);
             
             // Mevcut objeyi, yeni gelen detaylarla birleştir (credits, created_by vs. gelir)
             return { ...movie, ...fullDetails };
          } catch (e) {
              // Hata olursa eski haliyle devam et (Listeyi patlatma)
              console.warn(`Could not enrich movie ${movie.id}`, e);
              return movie;
          }
      }));

      // Veriyi Paylaşım İçin Optimize Et (Payload boyutunu düşür)
      const optimizedMovies = enrichedMovies.map(movie => {
          let credits = undefined;
          if (movie.credits) {
              credits = {
                  // Sadece ilk 15 oyuncuyu al (Analiz için yeterli)
                  cast: (movie.credits.cast || []).slice(0, 15).map(c => ({
                      id: c.id, 
                      name: c.name, 
                      character: c.character, 
                      profile_path: c.profile_path,
                      order: c.order
                  })),
                  // Yönetmenleri al
                  crew: (movie.credits.crew || []).filter(p => p.job === 'Director').map(c => ({
                      id: c.id,
                      name: c.name,
                      job: c.job,
                      department: c.department,
                      profile_path: c.profile_path
                  }))
              };
          }

          return {
              id: movie.id,
              title: movie.title,
              name: movie.name,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
              first_air_date: movie.first_air_date,
              genre_ids: movie.genre_ids,
              genres: movie.genres,
              overview: movie.overview ? movie.overview.substring(0, 200) + '...' : undefined, // Özet kısalt
              runtime: movie.runtime,
              episode_run_time: movie.episode_run_time,
              number_of_seasons: movie.number_of_seasons,
              number_of_episodes: movie.number_of_episodes,
              status: movie.status,
              created_by: movie.created_by,
              production_countries: movie.production_countries,
              addedAt: movie.addedAt,
              credits: credits // Artık dolu!
          }; 
      });

      const payload: any = { 
          id: shareId,
          user_id: user.id, 
          name: collection.name, 
          movies: optimizedMovies
      };

      try {
        payload.top_favorite_movies = collection.topFavoriteMovies;
        payload.top_favorite_shows = collection.topFavoriteShows;
        
        const { error } = await supabase.from('shared_lists').insert(payload);
        if (error) throw error;
        
      } catch (err) {
         console.warn("Saving with favorites failed, trying basics...", err);
         delete payload.top_favorite_movies;
         delete payload.top_favorite_shows;
         const { error: retryError } = await supabase.from('shared_lists').insert(payload);
         if (retryError) return null;
      }
      
      return `?list=${shareId}`;
  };

  const exitSharedMode = useCallback(() => {
      setSharedList(null);
  }, []);

  // --- 4. USER ACTIONS ---

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
          if (activeCollectionId === id) setActiveCollectionId(filtered[0].id);
          return filtered;
      });
      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').delete().eq('id', id);
      }
  };

  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    const targetCol = collections.find(c => c.id === activeCollectionId);
    if (!targetCol) return;

    const exists = targetCol.movies.some(m => m.id === movie.id);

    setCollections(prev => prev.map(col => {
        if (col.id === activeCollectionId) {
            if (exists) {
                return {
                    ...col,
                    movies: col.movies.filter(m => m.id !== movie.id),
                    topFavoriteMovies: (col.topFavoriteMovies || []).map(mid => mid === movie.id ? null : mid),
                    topFavoriteShows: (col.topFavoriteShows || []).map(mid => mid === movie.id ? null : mid),
                };
            } else {
                return { ...col, movies: [...col.movies, { ...movie, addedAt: new Date().toISOString() }] };
            }
        }
        return col;
    }));
  }, [activeCollectionId, collections]);

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

  const resetCollections = () => {
      setCollections([DEFAULT_COLLECTION]);
      setActiveCollectionId('default');
      setSharedList(null);
      processedUserId.current = null;
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