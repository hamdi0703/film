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
  is_blocked?: boolean; // Now derived from profiles table
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserStatus: (isBlocked: boolean) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_USER: User = {
  id: 'mock-admin-id-12345',
  email: 'admin@tria.app',
  user_metadata: { username: 'Admin' },
  is_blocked: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { showToast } = useToast();

  // Helper to check block status from public.profiles
  const checkBlockStatus = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', userId)
      .single();
    
    if (error || !data) return false;
    return data.is_blocked;
  };

  useEffect(() => {
    const init = async () => {
      const mock = localStorage.getItem('tria_mock_user');
      if (mock) { setUser(JSON.parse(mock)); setLoading(false); return; }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           const isBlocked = await checkBlockStatus(session.user.id);
           
           if(isBlocked) {
               await supabase.auth.signOut();
               showToast('Bu hesap engellenmiştir.', 'error');
           } else {
               setUser({ ...session.user, is_blocked: false });
           }
        }
      } catch (e) { console.warn("Auth init failed", e); }
      finally { setLoading(false); }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
        if (!localStorage.getItem('tria_mock_user')) {
             if (session?.user) {
                 const isBlocked = await checkBlockStatus(session.user.id);
                 if (isBlocked) {
                     await supabase.auth.signOut();
                     setUser(null);
                 } else {
                     setUser({ ...session.user, is_blocked: false });
                 }
             } else {
                 setUser(null);
             }
        }
    });
    return () => subscription.unsubscribe();
  }, [showToast]);

  const signIn = async (email: string, pass: string) => {
    if (email === 'admin' && pass === 'admin') {
      setUser(MOCK_ADMIN_USER);
      localStorage.setItem('tria_mock_user', JSON.stringify(MOCK_ADMIN_USER));
      return { user: MOCK_ADMIN_USER };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    
    // Check block status immediately after login
    if (data.user) {
        const isBlocked = await checkBlockStatus(data.user.id);
        if (isBlocked) {
            await supabase.auth.signOut();
            throw new Error('Hesabınız erişime kapatılmıştır.');
        }
    }

    showToast('Hoşgeldiniz', 'success');
    return data;
  };

  const signUp = async (email: string, pass: string, username: string) => {
    // Note: The SQL trigger will automatically create the profile entry
    const { data, error } = await supabase.auth.signUp({
      email, password: pass, options: { data: { username } }
    });
    if (error) throw error;
    showToast('Kayıt başarılı', 'success');
    return data;
  };

  const signOut = async () => {
    localStorage.removeItem('tria_collections');
    localStorage.removeItem('tria_user_reviews');
    if (localStorage.getItem('tria_mock_user')) {
       localStorage.removeItem('tria_mock_user');
       setUser(null);
       return;
    }
    await supabase.auth.signOut();
    showToast('Çıkış yapıldı', 'info');
  };

  // BLOCK USER LOGIC (Self-deactivation for Demo)
  const updateUserStatus = async (isBlocked: boolean) => {
      if (!user) return;
      
      // Mock User
      if (user.id.startsWith('mock-')) {
          const upd = { ...user, is_blocked: isBlocked };
          setUser(upd); localStorage.setItem('tria_mock_user', JSON.stringify(upd));
          return;
      }

      // Real User: Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isBlocked })
        .eq('id', user.id);

      if (error) { 
          console.error(error);
          showToast('Güncelleme başarısız', 'error'); 
          return; 
      }
      
      if (isBlocked) {
          showToast('Hesabınızı dondurdunuz. Çıkış yapılıyor...', 'error');
          setTimeout(() => signOut(), 2000);
      } else {
          showToast('Hesap aktif', 'success');
          setUser({ ...user, is_blocked: false });
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, loading, signIn, signUp, signOut, updateUserStatus, 
        isAuthModalOpen, openAuthModal: () => setIsAuthModalOpen(true), closeAuthModal: () => setIsAuthModalOpen(false) 
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