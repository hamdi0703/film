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
  toggleMovieInCollection: (movie: Movie) => Promise<void>; 
  checkIsSelected: (id: number) => boolean;
  loadSharedList: (ids: string[]) => Promise<void>;
  loadCloudList: (listId: string) => Promise<boolean>;
  shareCollection: (collectionId: string) => Promise<string | null>;
  resetCollections: () => void;
  updateTopFavorite: (slotIndex: number, movieId: number | null, type: MediaType) => void;
  exitSharedMode: () => void;
  refreshCollectionData: () => Promise<void>;
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
                  movies: col.movies, // Full objects with credits
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
      
      // Debounce save to prevent too many writes
      const handler = setTimeout(saveData, 2000);
      return () => clearTimeout(handler);
  }, [collections, user, authLoading]);

  // --- 3. SHARED LIST LOGIC ---
  const loadCloudList = useCallback(async (listId: string): Promise<boolean> => {
      setSharedList(null);
      try {
          const { data: listData, error: listError } = await supabase
              .from('shared_lists')
              .select('*')
              .eq('id', listId)
              .single();

          if (listError || !listData) {
              return false;
          }

          let ownerUsername = 'Anonim';
          try {
              if (listData.user_id) {
                  const { data: profileData } = await supabase
                      .from('profiles')
                      .select('username')
                      .eq('id', listData.user_id)
                      .maybeSingle(); 
                  if (profileData && profileData.username) ownerUsername = profileData.username;
              }
          } catch (e) { console.warn("Owner fetch failed", e); }

          const moviesArray = Array.isArray(listData.movies) ? listData.movies : [];

          const shared: Collection = {
              id: `shared-view-${listData.id}`,
              name: listData.name,
              owner: ownerUsername,
              movies: moviesArray,
              topFavoriteMovies: listData.top_favorite_movies || [null, null, null, null, null],
              topFavoriteShows: listData.top_favorite_shows || [null, null, null, null, null]
          };
          setSharedList(shared);
          return true;
      } catch (e) {
          console.error("Shared load exception:", e);
          return false;
      }
  }, []);

  const loadSharedList = useCallback(async (ids: string[]) => {
     setSharedList(null);
     try {
         const tmdb = new TmdbService();
         // Legacy support: fetch details for IDs
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
     } catch (e) { console.error("Legacy load error", e); }
  }, []);

  const shareCollection = async (collectionId: string): Promise<string | null> => {
      if (!user) {
          showToast('Liste paylaşmak için giriş yapmalısınız.', 'info');
          return null;
      }
      const collection = collections.find(c => c.id === collectionId);
      if (!collection || collection.movies.length === 0) {
          showToast('Boş bir listeyi paylaşamazsınız.', 'error');
          return null;
      }

      // Paylaşmadan önce verilerin %100 tam olduğundan emin ol (Son Kontrol)
      await refreshCollectionData();

      // State güncellemeleri asenkron olduğu için, burada collection referansı eski olabilir.
      // refreshCollectionData'dan sonra güncel veriyi almak için collections state'ini kullanamayız (closure).
      // Ancak, kullanıcı arayüzünde "Bekleyiniz" diyip arka planda işi bitirdiğimiz için
      // veritabanındaki (veya state'teki) en son hali almamız lazım.
      // Burada pratik bir çözüm olarak: refreshCollectionData zaten state'i güncellediği için
      // bir sonraki render döngüsünü beklemek gerekir ama biz manuel olarak state içindeki movie'leri
      // kontrol edip eksik varsa tekrar fetch edip payload'a koyacağız.
      
      const tmdb = new TmdbService();
      const enrichedMovies = await Promise.all(collection.movies.map(async (m) => {
          if (!m.credits || !m.production_countries) {
              try {
                  const isTv = !!(m.name || m.first_air_date);
                  const type = isTv ? 'tv' : 'movie';
                  return await tmdb.getMovieDetail(m.id, type);
              } catch { return m; }
          }
          return m;
      }));

      const shareId = generateUniqueShareId();
      const payload: any = { 
          id: shareId,
          user_id: user.id, 
          name: collection.name, 
          movies: enrichedMovies, 
          top_favorite_movies: collection.topFavoriteMovies,
          top_favorite_shows: collection.topFavoriteShows
      };

      try {
        const { error } = await supabase.from('shared_lists').insert(payload);
        if (error) throw error;
        return `?list=${shareId}`;
      } catch (err) {
         console.error("Share failed:", err);
         showToast('Liste kaydedilirken bir hata oluştu.', 'error');
         return null;
      }
  };

  const exitSharedMode = useCallback(() => { setSharedList(null); }, []);

  // --- 4. DATA REPAIR MECHANISM ---
  
  const refreshCollectionData = async () => {
      const activeCol = collections.find(c => c.id === activeCollectionId);
      if (!activeCol || activeCol.movies.length === 0) return;

      // Sadece verisi eksik olanları bul
      const moviesToUpdate = activeCol.movies.filter(m => !m.credits || !m.production_countries);
      
      if (moviesToUpdate.length === 0) return; 

      // showToast('Veriler güncelleniyor...', 'info'); // Çok sık çıkmaması için kapalı
      const tmdb = new TmdbService();
      
      const updatedMovies = await Promise.all(activeCol.movies.map(async (movie) => {
          // Credits yoksa EKSİK VERİDİR.
          if (!movie.credits || !movie.production_countries) {
              try {
                  const isTv = !!(movie.name || movie.first_air_date);
                  const type = isTv ? 'tv' : 'movie';
                  const details = await tmdb.getMovieDetail(movie.id, type);
                  return { ...movie, ...details }; // Mevcut verileri (addedAt vb) koru
              } catch (e) {
                  return movie;
              }
          }
          return movie;
      }));

      setCollections(prev => prev.map(col => {
          if (col.id === activeCollectionId) {
              return { ...col, movies: updatedMovies };
          }
          return col;
      }));
  };

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
      
      const nextId = collections.find(c => c.id !== id)?.id || 'default';
      
      setCollections(prev => {
          return prev.filter(c => c.id !== id);
      });
      setActiveCollectionId(nextId);

      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').delete().eq('id', id);
      }
  };

  // --- CORE: ADD/REMOVE MOVIE (The Critical Fix) ---
  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    const targetCol = collections.find(c => c.id === activeCollectionId);
    if (!targetCol) return;

    const exists = targetCol.movies.some(m => m.id === movie.id);

    if (exists) {
        // --- REMOVE ---
        setCollections(prev => prev.map(col => {
            if (col.id === activeCollectionId) {
                return {
                    ...col,
                    movies: col.movies.filter(m => m.id !== movie.id),
                    // Favorilerden de sil
                    topFavoriteMovies: (col.topFavoriteMovies || []).map(mid => mid === movie.id ? null : mid),
                    topFavoriteShows: (col.topFavoriteShows || []).map(mid => mid === movie.id ? null : mid),
                };
            }
            return col;
        }));
        showToast('Listeden çıkarıldı', 'info');
    } else {
        // --- ADD WITH FULL FETCH ---
        // Kullanıcıya hemen geri bildirim ver ama işlemi arkada yap
        // Ancak veri eksik gitmemesi için await kullanacağız.
        showToast('Ekleniyor...', 'info'); 
        
        try {
            const tmdb = new TmdbService();
            const isTv = !!(movie.name || movie.first_air_date);
            const type = isTv ? 'tv' : 'movie';
            
            // KEŞFET'ten gelen veri eksiktir. Mutlaka detay çek.
            const fullDetails = await tmdb.getMovieDetail(movie.id, type);
            
            const movieToAdd = { 
                ...movie, // Temel veriler (backdrop vb)
                ...fullDetails, // Detaylı veriler (credits, countries)
                addedAt: new Date().toISOString() 
            };

            setCollections(prev => prev.map(col => {
                if (col.id === activeCollectionId) {
                    return { ...col, movies: [...col.movies, movieToAdd] };
                }
                return col;
            }));
            showToast('Listeye eklendi', 'success');
        } catch (e) {
            console.error("Add failed", e);
            // Hata olursa en azından eldeki veriyi ekle (Fallback)
            const fallbackMovie = { ...movie, addedAt: new Date().toISOString() };
            setCollections(prev => prev.map(col => {
                if (col.id === activeCollectionId) {
                    return { ...col, movies: [...col.movies, fallbackMovie] };
                }
                return col;
            }));
            showToast('Eklendi (Detaylar daha sonra yüklenecek)', 'info');
        }
    }
  }, [activeCollectionId, collections, showToast]);

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
                  // Eğer bu film başka bir slotta varsa, o slotu boşalt
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
        exitSharedMode,
        refreshCollectionData
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