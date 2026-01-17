import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface AuthModalProps {
  onClose: () => void;
}

type AuthView = 'LOGIN' | 'REGISTER';

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signIn, signUp, user } = useAuth();
  const { showToast } = useToast();
  
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // --- FAILSAFE: Auto-close if user is detected ---
  // If the sign-in promise hangs but the auth listener updates the user state,
  // this ensures the modal closes and doesn't get stuck on "Loading".
  useEffect(() => {
    if (user) {
        onClose();
    }
  }, [user, onClose]);

  const getTurkishErrorMessage = (msg: string) => {
    if (!msg) return 'Bir hata oluştu.';
    if (msg.includes('Invalid login credentials')) return 'Email veya şifre hatalı.';
    if (msg.includes('Email not confirmed')) return 'Lütfen önce email adresinizi doğrulayın.';
    if (msg.includes('User already registered')) return 'Bu email ile zaten bir kullanıcı var.';
    if (msg.includes('Password should be at least')) return 'Şifre çok kısa (en az 6 karakter).';
    if (msg.includes('rate limit')) return 'Çok fazla deneme yaptınız, biraz bekleyin.';
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (view === 'LOGIN') {
        await signIn(email, password);
        // onClose() will be triggered by the useEffect above when user state updates
      } else if (view === 'REGISTER') {
        await signUp(email, password, username);
        setView('LOGIN'); 
      }
    } catch (error: any) {
      const msg = getTurkishErrorMessage(error.message);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
      switch(view) {
          case 'LOGIN': return 'Tekrar Hoşgeldiniz';
          case 'REGISTER': return 'Aramıza Katılın';
      }
  };

  const getDescription = () => {
      switch(view) {
          case 'LOGIN': return 'Film yolculuğunuza kaldığınız yerden devam edin.';
          case 'REGISTER': return 'Koleksiyonunuzu oluşturun ve düşüncelerinizi paylaşın.';
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-slide-in-up transition-all">
        <button 
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                {getTitle()}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {getDescription()}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'REGISTER' && (
                <div>
                    <label htmlFor="auth-username" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">Kullanıcı Adı</label>
                    <input 
                        id="auth-username"
                        type="text" 
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                        placeholder="SinemaGuru"
                    />
                </div>
            )}
            
            <div>
                <label htmlFor="auth-email" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">Email</label>
                <input 
                    id="auth-email"
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="ornek@email.com"
                />
            </div>

            <div>
                <div className="flex justify-between mb-2">
                    <label htmlFor="auth-password" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Şifre</label>
                </div>
                <input 
                    id="auth-password"
                    type="password" 
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {view === 'LOGIN' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {view === 'LOGIN' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                <button 
                    onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                    className="ml-2 font-bold text-indigo-600 hover:underline"
                >
                    {view === 'LOGIN' ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;