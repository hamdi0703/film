import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Collection, Movie, MediaType } from '../types';
import { useToast } from './ToastContext';
import { TmdbService } from '../services/tmdbService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface CollectionSettings {
    name: string;
    description: string;
    isPublic: boolean;
}

interface CollectionContextType {
  collections: Collection[];
  sharedList: Collection | null;
  activeCollectionId: string;
  setActiveCollectionId: (id: string) => void;
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  updateCollectionSettings: (id: string, settings: CollectionSettings) => Promise<void>;
  regenerateToken: (id: string) => Promise<string | null>;
  toggleMovieInCollection: (movie: Movie) => Promise<void>; 
  checkIsSelected: (id: number) => boolean;
  loadSharedList: (ids: string[]) => Promise<void>; // Legacy
  loadCloudList: (listId: string) => Promise<boolean>; // Legacy Snapshot
  loadCollectionByToken: (token: string) => Promise<boolean>; // NEW Live System
  resetCollections: () => void;
  updateTopFavorite: (slotIndex: number, movieId: number | null, type: MediaType) => void;
  exitSharedMode: () => void;
  refreshCollectionData: () => Promise<void>;
  forceSync: () => Promise<void>; // Manuel senkronizasyon için
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

const DEFAULT_COLLECTION: Collection = { 
    id: 'default', 
    name: 'Favoriler',
    description: 'Favori film ve dizilerim.',
    isPublic: false,
    movies: [], 
    topFavoriteMovies: [null, null, null, null, null],
    topFavoriteShows: [null, null, null, null, null]
};

const generateToken = (): string => {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [collections, setCollections] = useState<Collection[]>([DEFAULT_COLLECTION]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('default');
  const [sharedList, setSharedList] = useState<Collection | null>(null);

  // CRITICAL: Safety Guard
  // Veriler veritabanından TAMAMEN yüklenmeden kaydetmeyi engeller.
  const [isInitialized, setIsInitialized] = useState(false); 

  const isHydrating = useRef(false); 

  // --- 1. USER DATA INITIALIZATION ---
  useEffect(() => {
    if (authLoading) return;

    // Reset initialization state on user change
    setIsInitialized(false);
    
    const initUserData = async () => {
        isHydrating.current = true;
        
        // GUEST MODE or LOGGED OUT
        if (!user || user.id.startsWith('mock-')) {
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
            setIsInitialized(true); // Local load complete
            isHydrating.current = false;
            return;
        }

        // LOGGED IN USER (Supabase)
        try {
            console.log("Fetching collections for user:", user.id);
            
            // FIX: Explicitly select columns to avoid 400 Bad Request due to schema cache mismatch
            const { data, error } = await supabase
                .from('user_collections')
                .select(`
                    id,
                    name,
                    description,
                    is_public,
                    share_token,
                    movies,
                    top_favorite_movies,
                    top_favorite_shows,
                    user_id,
                    created_at
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const mapped: Collection[] = data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    description: d.description || '',
                    isPublic: d.is_public || false,
                    shareToken: d.share_token,
                    movies: Array.isArray(d.movies) ? d.movies : [],
                    topFavoriteMovies: d.top_favorite_movies || [null, null, null, null, null],
                    topFavoriteShows: d.top_favorite_shows || [null, null, null, null, null],
                    ownerId: d.user_id
                }));
                setCollections(mapped);
                
                // Eğer aktif koleksiyon silinenler arasındaysa, ilkini seç
                if (!mapped.find(c => c.id === activeCollectionId)) {
                    setActiveCollectionId(mapped[0].id);
                }
            } else {
                console.log("No collections found, using default.");
            }
            
            // BAŞARILI YÜKLEME SONRASI KİLİDİ AÇ
            setIsInitialized(true); 

        } catch (err: any) {
            console.error("User sync failed CRITICALLY:", err);
            showToast('Verileriniz yüklenirken hata oluştu. Lütfen sayfayı yenileyin.', 'error');
            // Hata varsa initialized TRUE YAPMA. Böylece auto-save çalışıp boş veri yazmaz.
        } finally {
            isHydrating.current = false;
        }
    };

    initUserData();
  }, [user, authLoading]);

  // --- 2. AUTO-SAVE LOGIC (SAFEGUARDED) ---
  useEffect(() => {
      // KORUMA: 
      // 1. Auth yükleniyorsa DUR.
      // 2. Veriler henüz DB'den çekilmediyse (isInitialized false) DUR.
      // 3. Mock user ise Supabase'e yazma.
      if (authLoading || !isInitialized) return;
      if (user && user.id.startsWith('mock-')) {
          localStorage.setItem('tria_collections', JSON.stringify(collections));
          return;
      }
      if (!user) {
          localStorage.setItem('tria_collections', JSON.stringify(collections));
          return;
      }

      // Supabase Auto-Save
      const saveData = async () => {
          const payload = collections.map(col => ({
              id: col.id,
              user_id: user.id,
              name: col.name,
              description: col.description,
              is_public: col.isPublic,
              share_token: col.shareToken,
              movies: col.movies || [], 
              top_favorite_movies: col.topFavoriteMovies,
              top_favorite_shows: col.topFavoriteShows,
              updated_at: new Date().toISOString()
          }));
          
          try {
              const { error } = await supabase.from('user_collections').upsert(payload, { onConflict: 'id' });
              if (error) {
                  console.error("Auto-save error:", error);
              }
          } catch (err) { 
              console.error("Auto-save exception:", err); 
          }
      };
      
      // Debounce save
      const handler = setTimeout(saveData, 2000);
      return () => clearTimeout(handler);
  }, [collections, user, authLoading, isInitialized]);

  // --- 3. SHARED LIST LOADING ---
  
  const loadCollectionByToken = useCallback(async (token: string): Promise<boolean> => {
      setSharedList(null);
      try {
          const { data, error } = await supabase
            .from('user_collections')
            .select('*')
            .eq('share_token', token)
            .single();
            
          if (error || !data) return false;

          const currentUserId = (await supabase.auth.getUser()).data.user?.id;
          const isOwner = currentUserId === data.user_id;

          if (!data.is_public && !isOwner) {
              return false; 
          }

          let ownerUsername = 'Anonim';
          try {
              if (data.user_id) {
                  const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user_id).maybeSingle();
                  if (profile?.username) ownerUsername = profile.username;
              }
          } catch(e) {}

          const shared: Collection = {
              id: `live-${data.id}`,
              name: data.name,
              description: data.description,
              isPublic: data.is_public,
              movies: Array.isArray(data.movies) ? data.movies : [], // Null check
              topFavoriteMovies: data.top_favorite_movies,
              topFavoriteShows: data.top_favorite_shows,
              owner: ownerUsername,
              ownerId: data.user_id 
          };
          setSharedList(shared);
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }, []);

  const loadCloudList = useCallback(async (listId: string): Promise<boolean> => {
      setSharedList(null);
      try {
          const { data, error } = await supabase.from('shared_lists').select('*').eq('id', listId).single();
          if (error || !data) return false;

          const shared: Collection = {
              id: `legacy-${data.id}`,
              name: data.name,
              description: 'Arşivlenmiş Liste',
              movies: Array.isArray(data.movies) ? data.movies : [],
              topFavoriteMovies: data.top_favorite_movies,
              topFavoriteShows: data.top_favorite_shows,
              owner: 'Anonim'
          };
          setSharedList(shared);
          return true;
      } catch (e) { return false; }
  }, []);

  const loadSharedList = useCallback(async (ids: string[]) => {
      const tmdb = new TmdbService();
      const res = await Promise.all(ids.slice(0, 20).map(id => tmdb.getMovieDetail(parseInt(id)).catch(()=>null)));
      const valid = res.filter(m => !!m) as Movie[];
      setSharedList({
          id: 'legacy-ids',
          name: 'Paylaşılan İçerikler',
          movies: valid.map(m => ({...m, addedAt: new Date().toISOString()})),
          isPublic: true
      });
  }, []);

  const exitSharedMode = useCallback(() => { setSharedList(null); }, []);

  // --- 4. SETTINGS & MANAGEMENT ---

  const updateCollectionSettings = async (id: string, settings: CollectionSettings) => {
      setCollections(prev => prev.map(c => {
          if (c.id === id) {
              return { ...c, name: settings.name, description: settings.description, isPublic: settings.isPublic };
          }
          return c;
      }));

      const current = collections.find(c => c.id === id);
      let token = current?.shareToken;
      
      if (settings.isPublic && !token) {
          token = generateToken();
          setCollections(prev => prev.map(c => c.id === id ? { ...c, shareToken: token } : c));
      }

      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').update({
              name: settings.name,
              description: settings.description,
              is_public: settings.isPublic,
              share_token: token
          }).eq('id', id);
      }
      showToast('Ayarlar güncellendi', 'success');
  };

  const regenerateToken = async (id: string): Promise<string | null> => {
      const newToken = generateToken();
      setCollections(prev => prev.map(c => c.id === id ? { ...c, shareToken: newToken } : c));
      
      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').update({ share_token: newToken }).eq('id', id);
      }
      showToast('Bağlantı yenilendi, eskisi artık geçersiz.', 'info');
      return newToken;
  };

  const createCollection = (name: string) => {
      if (!user) { showToast('Giriş yapmalısınız', 'info'); return; }
      const newCol: Collection = { 
          id: `col-${Date.now()}`, 
          name: name, 
          description: '',
          isPublic: false,
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
      setCollections(prev => prev.filter(c => c.id !== id));
      setActiveCollectionId(nextId);

      if (user && !user.id.startsWith('mock-')) {
          await supabase.from('user_collections').delete().eq('id', id);
      }
      showToast('Liste silindi', 'info');
  };

  // --- 5. DATA OPERATIONS ---
  
  // Force Sync: Kullanıcı manuel olarak verileri tekrar çekmek isterse
  const forceSync = async () => {
      if (!user || user.id.startsWith('mock-')) return;
      setIsInitialized(false);
      try {
          const { data, error } = await supabase
                .from('user_collections')
                .select(`
                    id,
                    name,
                    description,
                    is_public,
                    share_token,
                    movies,
                    top_favorite_movies,
                    top_favorite_shows,
                    user_id,
                    created_at
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
                const mapped: Collection[] = data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    description: d.description || '',
                    isPublic: d.is_public || false,
                    shareToken: d.share_token,
                    movies: Array.isArray(d.movies) ? d.movies : [],
                    topFavoriteMovies: d.top_favorite_movies || [null, null, null, null, null],
                    topFavoriteShows: d.top_favorite_shows || [null, null, null, null, null],
                    ownerId: d.user_id
                }));
                setCollections(mapped);
                showToast('Veriler senkronize edildi.', 'success');
          }
      } catch (e) {
          console.error(e);
          showToast('Senkronizasyon hatası.', 'error');
      } finally {
          setIsInitialized(true);
      }
  };

  const refreshCollectionData = async () => {
      const activeCol = collections.find(c => c.id === activeCollectionId);
      if (!activeCol || activeCol.movies.length === 0) return;

      const moviesToUpdate = activeCol.movies.filter(m => !m.credits || !m.production_countries);
      if (moviesToUpdate.length === 0) return; 

      const tmdb = new TmdbService();
      const updatedMovies = await Promise.all(activeCol.movies.map(async (movie) => {
          if (!movie.credits || !movie.production_countries) {
              try {
                  const isTv = !!(movie.name || movie.first_air_date);
                  const type = isTv ? 'tv' : 'movie';
                  const details = await tmdb.getMovieDetail(movie.id, type);
                  return { ...movie, ...details }; 
              } catch (e) { return movie; }
          }
          return movie;
      }));

      setCollections(prev => prev.map(col => col.id === activeCollectionId ? { ...col, movies: updatedMovies } : col));
  };

  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    const targetCol = collections.find(c => c.id === activeCollectionId);
    
    if (!targetCol) return;

    const exists = targetCol.movies.some(m => m.id === movie.id);

    if (exists) {
        setCollections(prev => prev.map(col => {
            if (col.id === activeCollectionId) {
                return {
                    ...col,
                    movies: col.movies.filter(m => m.id !== movie.id),
                    topFavoriteMovies: (col.topFavoriteMovies || []).map(mid => mid === movie.id ? null : mid),
                    topFavoriteShows: (col.topFavoriteShows || []).map(mid => mid === movie.id ? null : mid),
                };
            }
            return col;
        }));
    } else {
        try {
            const tmdb = new TmdbService();
            const isTv = !!(movie.name || movie.first_air_date);
            const type = isTv ? 'tv' : 'movie';
            const fullDetails = await tmdb.getMovieDetail(movie.id, type);
            
            const movieToAdd = { ...movie, ...fullDetails, addedAt: new Date().toISOString() };

            setCollections(prev => prev.map(col => {
                if (col.id === activeCollectionId) {
                    return { ...col, movies: [...col.movies, movieToAdd] };
                }
                return col;
            }));
        } catch (e) {
            const fallbackMovie = { ...movie, addedAt: new Date().toISOString() };
            setCollections(prev => prev.map(col => col.id === activeCollectionId ? { ...col, movies: [...col.movies, fallbackMovie] } : col));
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
      setIsInitialized(false);
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
        updateCollectionSettings,
        regenerateToken,
        toggleMovieInCollection, 
        checkIsSelected, 
        loadSharedList, 
        loadCloudList, 
        loadCollectionByToken,
        resetCollections, 
        updateTopFavorite,
        exitSharedMode,
        refreshCollectionData,
        forceSync
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