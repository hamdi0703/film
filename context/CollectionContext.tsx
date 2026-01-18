
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
    // 12 karakterlik rastgele güvenli token
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
  
  // Shared List State (Görüntülenen harici liste)
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
                        movies: d.movies || [],
                        topFavoriteMovies: d.top_favorite_movies || [null, null, null, null, null],
                        topFavoriteShows: d.top_favorite_shows || [null, null, null, null, null],
                        ownerId: d.user_id // ÖNEMLİ: Sahibi tanımak için
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
              // Sadece temel verileri kaydet, ayarlar ayrıca updateCollectionSettings ile yapılıyor
              const payload = collections.map(col => ({
                  id: col.id,
                  user_id: user.id,
                  name: col.name,
                  description: col.description,
                  is_public: col.isPublic,
                  share_token: col.shareToken,
                  movies: col.movies, 
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

  // --- 3. SHARED LIST LOADING (Live & Legacy) ---
  
  // NEW: Live Collection Loading via Token
  const loadCollectionByToken = useCallback(async (token: string): Promise<boolean> => {
      setSharedList(null);
      try {
          // 1. Önce token'a göre veriyi çekmeyi dene.
          // RLS (is_public=true OR owner) burada devreye girer.
          const { data, error } = await supabase
            .from('user_collections')
            .select('*')
            .eq('share_token', token)
            .single();
            
          if (error || !data) return false;

          // 2. Client-Side Güvenlik Katmanı:
          // Eğer liste gizliyse (is_public=false) ve bakan kişi sahibi DEĞİLSE, gösterme.
          const currentUserId = (await supabase.auth.getUser()).data.user?.id;
          const isOwner = currentUserId === data.user_id;

          if (!data.is_public && !isOwner) {
              return false; // Erişim engellendi
          }

          // Owner username fetch
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
              movies: data.movies || [],
              topFavoriteMovies: data.top_favorite_movies,
              topFavoriteShows: data.top_favorite_shows,
              owner: ownerUsername,
              ownerId: data.user_id // ID'yi sakla ki UI'da 'edit' butonu gösterebilelim
          };
          setSharedList(shared);
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }, []);

  // LEGACY: Snapshot Loading (Eski linkleri desteklemek için)
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
              owner: 'Anonim' // Legacy'de user fetch ile uğraşmıyoruz
          };
          setSharedList(shared);
          return true;
      } catch (e) { return false; }
  }, []);

  const loadSharedList = useCallback(async (ids: string[]) => {
      // Legacy URL param support
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

      // Token yoksa ve public yapılıyorsa otomatik token oluştur
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

  // CRITICAL FIX: Bu fonksiyon HER ZAMAN kullanıcının YEREL/AKTİF listesini değiştirir.
  // Paylaşılan bir listede geziyor olsa bile, "Ekle" dediğinde KENDİ listesine eklemeli.
  const toggleMovieInCollection = useCallback(async (movie: Movie) => {
    const targetCol = collections.find(c => c.id === activeCollectionId);
    
    // Eğer yerel liste yoksa veya kullanıcı yoksa işlem yapma
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
        showToast('Listeden çıkarıldı', 'info');
    } else {
        showToast('Ekleniyor...', 'info'); 
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
            showToast('Listeye eklendi', 'success');
        } catch (e) {
            const fallbackMovie = { ...movie, addedAt: new Date().toISOString() };
            setCollections(prev => prev.map(col => col.id === activeCollectionId ? { ...col, movies: [...col.movies, fallbackMovie] } : col));
            showToast('Eklendi (Detaylar daha sonra yüklenecek)', 'info');
        }
    }
  }, [activeCollectionId, collections, showToast]);

  // CRITICAL FIX: Bu fonksiyon da HER ZAMAN kullanıcının YEREL/AKTİF listesini kontrol etmeli.
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
