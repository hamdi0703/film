import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface User {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
  is_blocked?: boolean; 
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (username: string, avatarUrl: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserStatus: (isBlocked: boolean) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock admin user for offline/demo testing
const MOCK_ADMIN_USER: User = {
  id: 'mock-admin-id-12345',
  email: 'admin@tria.app',
  created_at: new Date().toISOString(),
  user_metadata: { username: 'Admin', avatar_url: '' },
  is_blocked: false,
  is_admin: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // Güvenli Profil Çekme Fonksiyonu
  const fetchUserProfile = async (authUser: any) => {
      // Mock kullanıcı ise direkt dön
      if (authUser.id.startsWith('mock-')) return authUser;

      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_blocked, is_admin, username, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle(); // single() yerine maybeSingle() hata fırlatmaz, null döner
          
          if (error) {
            console.warn("Profil verisi çekilemedi (RLS veya bağlantı hatası):", error.message);
            // Hata olsa bile giriş yapmasına izin ver, sadece admin yetkisi olmaz.
            return authUser;
          }

          if (data) {
              // Bloklanmış kullanıcı kontrolü
              if (data.is_blocked) {
                  await supabase.auth.signOut();
                  setUser(null);
                  throw new Error('Hesabınız erişime kapatılmıştır.');
              }
              
              // Auth User ile Profil Verisini Birleştir
              // Profil tablosundaki username/avatar önceliklidir
              return {
                  ...authUser,
                  user_metadata: {
                      ...authUser.user_metadata,
                      username: data.username || authUser.user_metadata?.username,
                      avatar_url: data.avatar_url || authUser.user_metadata?.avatar_url,
                  },
                  is_blocked: data.is_blocked,
                  is_admin: data.is_admin
              };
          }
      } catch (e: any) {
          if (e.message === 'Hesabınız erişime kapatılmıştır.') throw e;
          console.error("Kritik Profil Hatası:", e);
      }
      
      // Profil yoksa bile standart kullanıcı olarak devam et
      return authUser;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. Mock Kullanıcı Kontrolü
      const mock = localStorage.getItem('tria_mock_user');
      if (mock) {
          if(mounted) {
            setUser(JSON.parse(mock));
            setLoading(false);
          }
          return;
      }

      // 2. Supabase Oturumu Kontrolü
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            const enrichedUser = await fetchUserProfile(session.user);
            setUser(enrichedUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 3. Auth Listener (Oturum Değişikliklerini Dinle)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (localStorage.getItem('tria_mock_user')) return;

        if (session?.user) {
            try {
                const enrichedUser = await fetchUserProfile(session.user);
                setUser(enrichedUser);
            } catch (error) {
                // Bloklanmışsa kullanıcıyı null yap
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    // Mock Admin Login (Geliştirme Amaçlı)
    if (email === 'admin' && pass === 'admin') {
      localStorage.setItem('tria_mock_user', JSON.stringify(MOCK_ADMIN_USER));
      setUser(MOCK_ADMIN_USER);
      showToast('Giriş başarılı (Admin Modu)', 'success');
      return;
    }
    
    // Gerçek Supabase Girişi
    localStorage.removeItem('tria_mock_user');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      console.error("Giriş Hatası:", error);
      throw error;
    }
    
    if (data.user) {
      const enrichedUser = await fetchUserProfile(data.user);
      setUser(enrichedUser);
      showToast('Giriş başarılı!', 'success');
    }
  };

  const signUp = async (email: string, pass: string, username: string) => {
    localStorage.removeItem('tria_mock_user');
    const { error } = await supabase.auth.signUp({
      email, password: pass, options: { data: { username } }
    });
    if (error) throw error;
    showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
  };

  const signOut = async () => {
    localStorage.removeItem('tria_collections');
    localStorage.removeItem('tria_user_reviews');
    localStorage.removeItem('tria_mock_user');
    
    if (user && !user.id.startsWith('mock-')) {
        await supabase.auth.signOut();
    }
    
    setUser(null); 
    showToast('Çıkış yapıldı', 'info');
  };

  const updateProfile = async (username: string, avatarUrl: string) => {
    if (!user) return;
    
    if (user.id.startsWith('mock-')) {
        const upd = { ...user, user_metadata: { ...user.user_metadata, username, avatar_url: avatarUrl } };
        setUser(upd); 
        localStorage.setItem('tria_mock_user', JSON.stringify(upd));
        showToast('Profil güncellendi', 'success');
        return;
    }

    // 1. Auth Metadata Güncelle
    const { error } = await supabase.auth.updateUser({
      data: { username, avatar_url: avatarUrl }
    });
    if (error) throw error;

    // 2. Profiles Tablosunu Güncelle
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ username, avatar_url: avatarUrl })
        .eq('id', user.id);
    
    if (profileError) {
        console.error("Profil tablosu güncellenemedi:", profileError);
        // Kritik hata değil, devam et
    }

    setUser(prev => prev ? ({
        ...prev,
        user_metadata: { ...prev.user_metadata, username, avatar_url: avatarUrl }
    }) : null);

    showToast('Profil güncellendi', 'success');
  };

  const updatePassword = async (password: string) => {
      if (user?.id.startsWith('mock-')) return;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Şifreniz güncellendi', 'success');
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
        if (!user.id.startsWith('mock-')) {
             // Supabase Client tarafında kullanıcı silme yetkisi genelde kapalıdır.
             // Bu yüzden sadece çıkış yapıyoruz. Gerçek silme için Edge Function gerekir.
             await supabase.auth.signOut();
        }
        await signOut();
        showToast('Hesabınız silindi.', 'info');
    } catch (e) {
        console.error(e);
        await signOut(); 
    }
  };

  const updateUserStatus = async (isBlocked: boolean) => {
      if (!user) return;
      if (user.id.startsWith('mock-')) {
          const upd = { ...user, is_blocked: isBlocked };
          setUser(upd); localStorage.setItem('tria_mock_user', JSON.stringify(upd));
          return;
      }
      
      const { error } = await supabase.from('profiles').update({ is_blocked: isBlocked }).eq('id', user.id);

      if (error) { 
          showToast('İşlem başarısız', 'error'); 
          return; 
      }

      if (isBlocked) {
          showToast('Hesap donduruldu, çıkış yapılıyor...', 'info');
          setTimeout(signOut, 1500);
      } else {
          showToast('Hesap aktif edildi', 'success');
          setUser({ ...user, is_blocked: false });
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        signIn, 
        signUp, 
        signOut, 
        updateProfile,
        updatePassword,
        deleteAccount,
        updateUserStatus, 
        isAuthModalOpen, 
        openAuthModal: () => setIsAuthModalOpen(true), 
        closeAuthModal: () => setIsAuthModalOpen(false) 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth missing');
    return context;
}