import React from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
  onResetApp: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onResetApp }) => {
  const { collections } = useCollectionContext();
  const { user, signOut, updateUserStatus } = useAuth();

  // Stats Calculation
  const totalCollections = collections.length;
  const totalMovies = collections.reduce((acc, col) => acc + col.movies.length, 0);
  const uniqueMovies = new Set(collections.flatMap(c => c.movies.map(m => m.id))).size;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const username = user?.user_metadata?.username || 'Misafir';
  const email = user?.email || '';
  const isBlocked = user?.user_metadata?.is_blocked || false;

  const handleToggleBlock = () => {
      const newValue = !isBlocked;
      if (newValue) {
          if (window.confirm("Dikkat! Hesabınızı engellemek (block) üzeresiniz. Bunu yaparsanız oturumunuz kapatılacak ve tekrar giriş yapamayacaksınız. Onaylıyor musunuz?")) {
              updateUserStatus(true);
          }
      } else {
          updateUserStatus(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-neutral-950 shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Profil</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Avatar & User Info */}
            <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${isBlocked ? 'from-red-500 to-red-700' : 'from-indigo-500 to-purple-600'} flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 border-4 border-white dark:border-neutral-800`}>
                    {username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {username}
                    {isBlocked && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">ENGELLİ</span>}
                </h3>
                <p className="text-sm text-neutral-500">{email}</p>
            </div>

            {/* Stats Grid */}
            <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">İstatistikler</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{totalCollections}</div>
                        <div className="text-xs text-neutral-500">Liste</div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-indigo-500">{totalMovies}</div>
                        <div className="text-xs text-neutral-500">Film</div>
                    </div>
                    <div className="col-span-2 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl flex items-center justify-between px-6">
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Benzersiz Yapım</span>
                        <span className="text-xl font-bold text-neutral-900 dark:text-white">{uniqueMovies}</span>
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Hesap</h4>
                
                {/* Block User Toggle (Supabase Metadata) */}
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl flex items-center justify-between mb-4">
                    <div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-white">Kullanıcıyı Engelle</div>
                        <div className="text-xs text-neutral-500">Erişimi kısıtla (is_blocked)</div>
                    </div>
                    
                    <button 
                        onClick={handleToggleBlock}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBlocked ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                    >
                        <span className="sr-only">Kullanıcıyı Engelle</span>
                        <span
                            className={`${
                                isBlocked ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
                
                {isBlocked && (
                     <div className="text-[10px] text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                         Durum: TRUE (Kullanıcı Engellendi)
                     </div>
                )}

                <button 
                    onClick={handleSignOut}
                    className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Çıkış Yap
                </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button 
                    onClick={() => {
                        if(window.confirm('Emin misiniz? Cihazdaki tüm veriler temizlenecektir.')) {
                            onResetApp();
                        }
                    }}
                    className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Önbelleği Temizle
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;