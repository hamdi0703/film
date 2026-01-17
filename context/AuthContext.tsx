import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
  is_blocked?: boolean; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string) => Promise<any>;
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
  user_metadata: { username: 'Admin', avatar_url: '' },
  is_blocked: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // Helper to check if user is blocked in DB
  const checkBlockStatus = async (userId: string): Promise<boolean> => {
    // If it's a mock user, never blocked by DB
    if (userId.startsWith('mock-')) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) {
          // If profile doesn't exist yet (new user), not blocked
          return false;
      }
      return data?.is_blocked || false;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check
    const init = async () => {
      const mock = localStorage.getItem('tria_mock_user');
      if (mock) { 
          if(mounted) { setUser(JSON.parse(mock)); setLoading(false); }
          return; 
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           const isBlocked = await checkBlockStatus(session.user.id);
           if(isBlocked) {
               await supabase.auth.signOut();
               if(mounted) showToast('Bu hesap engellenmiştir.', 'error');
           } else {
               if(mounted) setUser({ ...session.user, is_blocked: false });
           }
        }
      } catch (e) { 
          console.warn("Auth init failed", e); 
      } finally { 
          if(mounted) setLoading(false); 
      }
    };
    init();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        // If we are currently using a mock user, DO NOT let Supabase overwrite it unless we explicitly cleared it.
        if (localStorage.getItem('tria_mock_user')) return;
        
        try {
            if (session?.user) {
                // If user changed or just logged in, verify block status
                const isBlocked = await checkBlockStatus(session.user.id);
                if (isBlocked) {
                    await supabase.auth.signOut();
                    if(mounted) {
                        setUser(null);
                        showToast('Hesabınız erişime kapatılmıştır.', 'error');
                    }
                } else {
                    if(mounted) setUser({ ...session.user, is_blocked: false });
                }
            } else {
                if(mounted) setUser(null);
            }
        } catch (err) {
            console.error("Auth change error:", err);
        } finally {
            if(mounted) setLoading(false);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, [showToast]);

  const signIn = async (email: string, pass: string) => {
    // 1. Mock Admin Login
    if (email === 'admin' && pass === 'admin') {
      setUser(MOCK_ADMIN_USER);
      localStorage.setItem('tria_mock_user', JSON.stringify(MOCK_ADMIN_USER));
      return { user: MOCK_ADMIN_USER };
    }
    
    // 2. Real Login - CRITICAL FIX:
    // If we were previously a mock user, we MUST clear that flag so the listener works.
    localStorage.removeItem('tria_mock_user');

    // Attempt Login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;

    showToast('Giriş başarılı!', 'success');
    return data;
  };

  const signUp = async (email: string, pass: string, username: string) => {
    localStorage.removeItem('tria_mock_user');
    
    const { data, error } = await supabase.auth.signUp({
      email, password: pass, options: { data: { username } }
    });
    if (error) throw error;
    showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
    return data;
  };

  const signOut = async () => {
    localStorage.removeItem('tria_collections');
    localStorage.removeItem('tria_user_reviews');
    
    // Clear mock data
    if (localStorage.getItem('tria_mock_user')) {
       localStorage.removeItem('tria_mock_user');
       setUser(null);
       showToast('Çıkış yapıldı', 'info');
       return;
    }

    await supabase.auth.signOut();
    setUser(null); 
    showToast('Çıkış yapıldı', 'info');
  };

  const updateProfile = async (username: string, avatarUrl: string) => {
    if (!user) return;
    if (user.id.startsWith('mock-')) {
        const upd = { ...user, user_metadata: { ...user.user_metadata, username, avatar_url: avatarUrl } };
        setUser(upd); localStorage.setItem('tria_mock_user', JSON.stringify(upd));
        showToast('Profil güncellendi (Mock)', 'success');
        return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { username, avatar_url: avatarUrl }
    });
    if (authError) throw authError;

    // Try to update profiles table, but don't crash if it fails (lazy sync)
    try {
        await supabase.from('profiles').update({
        username,
        avatar_url: avatarUrl
        }).eq('id', user.id);
    } catch(e) { console.warn("Profile table update skipped"); }

    setUser(prev => prev ? ({
        ...prev,
        user_metadata: { ...prev.user_metadata, username, avatar_url: avatarUrl }
    }) : null);

    showToast('Profil başarıyla güncellendi', 'success');
  };

  const updatePassword = async (password: string) => {
      if (!user) return;
      if (user.id.startsWith('mock-')) {
          showToast('Mock kullanıcı şifresi değiştirilemez', 'info');
          return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Şifreniz güncellendi', 'success');
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (user.id.startsWith('mock-')) {
        signOut();
        return;
    }

    try {
        const { error } = await supabase.rpc('delete_own_account');
        if (error) throw error;
        await signOut();
        showToast('Hesabınız kalıcı olarak silindi.', 'info');
    } catch (e) {
        console.error(e);
        // Fallback for UI
        await signOut();
        showToast('Hesap silindi.', 'info');
    }
  };

  const updateUserStatus = async (isBlocked: boolean) => {
      if (!user) return;
      if (user.id.startsWith('mock-')) {
          const upd = { ...user, is_blocked: isBlocked };
          setUser(upd); localStorage.setItem('tria_mock_user', JSON.stringify(upd));
          return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isBlocked })
        .eq('id', user.id);

      if (error) { 
          showToast('Güncelleme başarısız', 'error'); 
          return; 
      }
      if (isBlocked) {
          showToast('Hesabınızı dondurdunuz.', 'error');
          setTimeout(() => signOut(), 2000);
      } else {
          showToast('Hesap aktif', 'success');
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