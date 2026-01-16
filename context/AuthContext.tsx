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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string) => Promise<any>;
  signOut: () => Promise<void>;
  // UI State for Modal
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MOCK ADMIN USER DEFINITION
const MOCK_ADMIN_USER: User = {
  id: 'mock-admin-id-12345',
  email: 'admin@vista.app',
  user_metadata: {
    username: 'Admin',
    avatar_url: null,
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Global Modal State
  const { showToast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check for Mock Session in LocalStorage first
      const mockSession = localStorage.getItem('vista_mock_user');
      if (mockSession) {
        setUser(JSON.parse(mockSession));
        setLoading(false);
        return;
      }

      // 2. Try Supabase Session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        // Suppress "Failed to fetch" if Supabase is not configured correctly yet
        console.warn("Supabase bağlantısı kurulamadı (Offline modda devam ediliyor):", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Setup Listener (Safe wrap)
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        // Only update if not using mock user
        if (!localStorage.getItem('vista_mock_user')) {
           setUser(session?.user ?? null);
        }
        setLoading(false);
      });
      return () => subscription.unsubscribe();
    } catch (e) {
      console.warn("Auth listener hatası", e);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    // --- ADMIN BYPASS ---
    if (email === 'admin' && pass === 'admin') {
      setUser(MOCK_ADMIN_USER);
      localStorage.setItem('vista_mock_user', JSON.stringify(MOCK_ADMIN_USER));
      showToast('Admin girişi yapıldı (Offline Mod)', 'success');
      return { user: MOCK_ADMIN_USER, session: null };
    }
    // --------------------

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      showToast('Tekrar hoşgeldiniz!', 'success');
      return data;
    } catch (error: any) {
      // Handle "Failed to fetch" specifically for better UX
      if (error.message === 'Failed to fetch') {
         showToast('Sunucuya bağlanılamadı. İnternet bağlantınızı veya Supabase ayarlarını kontrol edin.', 'error');
      } else {
         showToast(error.message || 'Giriş yapılamadı', 'error');
      }
      throw error;
    }
  };

  const signUp = async (email: string, pass: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            username: username,
          },
        },
      });
      if (error) throw error;
      showToast('Hesap oluşturuldu! Hoşgeldiniz.', 'success');
      return data;
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
         showToast('Sunucuya erişilemiyor.', 'error');
      } else {
         showToast(error.message || 'Kayıt olunamadı', 'error');
      }
      throw error;
    }
  };

  const signOut = async () => {
    // 1. Clear Application Data from Local Storage
    localStorage.removeItem('vista_collections');
    localStorage.removeItem('vista_user_reviews');
    
    // Check if Mock User
    if (localStorage.getItem('vista_mock_user')) {
      localStorage.removeItem('vista_mock_user');
      setUser(null);
      showToast('Çıkış yapıldı', 'info');
      // Force reload to clear context states if needed, or rely on context updates
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast('Çıkış yapıldı', 'info');
    } catch (error: any) {
      // Even if network fails, force logout on UI
      setUser(null);
      console.error(error);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        signIn, 
        signUp, 
        signOut,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};