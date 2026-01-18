import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface User {
  id: string;
  email?: string;
  created_at?: string; // EKLENDİ: Katılım tarihi için
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
  is_blocked?: boolean; 
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

const MOCK_ADMIN_USER: User = {
  id: 'mock-admin-id-12345',
  email: 'admin@tria.app',
  created_at: new Date().toISOString(),
  user_metadata: { username: 'Admin', avatar_url: '' },
  is_blocked: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // Arka planda çalışacak güvenlik kontrolü (UI'ı bloklamaz)
  const verifyUserSecurity = async (userId: string) => {
    if (userId.startsWith('mock-')) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data?.is_blocked) {
          await supabase.auth.signOut();
          setUser(null);
          showToast('Hesabınız erişime kapatılmıştır.', 'error');
      }
    } catch (e) {
      console.error("Security check failed:", e);
    }
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
            setUser(session.user); // UI'ı hemen güncelle
            verifyUserSecurity(session.user.id); // Arka planda kontrol et
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

    // 3. Auth Listener (Giriş/Çıkış olaylarını dinle)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        
        // Mock kullanıcı varsa Supabase eventlerini yoksay
        if (localStorage.getItem('tria_mock_user')) return;

        if (session?.user) {
            setUser(session.user);
            // Login sonrası hemen blok kontrolü yapma, zaten init veya signin içinde tetiklenebilir.
            // Ancak session yenilemelerinde güvenlik için hafif bir kontrol iyidir.
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, [showToast]);

  const signIn = async (email: string, pass: string) => {
    // Mock Login
    if (email === 'admin' && pass === 'admin') {
      localStorage.setItem('tria_mock_user', JSON.stringify(MOCK_ADMIN_USER));
      setUser(MOCK_ADMIN_USER);
      showToast('Giriş başarılı (Admin)', 'success');
      return;
    }
    
    // Gerçek Login
    localStorage.removeItem('tria_mock_user');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) throw error;
    if (data.user) {
      setUser(data.user); // State'i anında güncelle
      showToast('Giriş başarılı!', 'success');
      verifyUserSecurity(data.user.id); // Blok kontrolünü arkadan yap
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
    // Temizlik
    localStorage.removeItem('tria_collections');
    localStorage.removeItem('tria_user_reviews');
    localStorage.removeItem('tria_mock_user');
    
    if (!user?.id.startsWith('mock-')) {
        await supabase.auth.signOut();
    }
    
    setUser(null); 
    showToast('Çıkış yapıldı', 'info');
  };

  const updateProfile = async (username: string, avatarUrl: string) => {
    if (!user) return;
    
    // Mock Update
    if (user.id.startsWith('mock-')) {
        const upd = { ...user, user_metadata: { ...user.user_metadata, username, avatar_url: avatarUrl } };
        setUser(upd); 
        localStorage.setItem('tria_mock_user', JSON.stringify(upd));
        showToast('Profil güncellendi', 'success');
        return;
    }

    // Real Update
    const { error } = await supabase.auth.updateUser({
      data: { username, avatar_url: avatarUrl }
    });
    if (error) throw error;

    // Profil tablosunu güncelle (Fire & Forget)
    supabase.from('profiles').update({ username, avatar_url: avatarUrl }).eq('id', user.id).then();

    // Local state güncelle
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
            const { error } = await supabase.rpc('delete_own_account');
            if (error) throw error;
        }
        await signOut();
        showToast('Hesabınız silindi.', 'info');
    } catch (e) {
        console.error(e);
        await signOut(); // Hata olsa bile çıkış yap
    }
  };

  const updateUserStatus = async (isBlocked: boolean) => {
      if (!user) return;
      // Mock status update
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