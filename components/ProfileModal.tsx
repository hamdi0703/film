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

  const totalCollections = collections.length;
  const totalMovies = collections.reduce((acc, col) => acc + col.movies.length, 0);
  
  const handleSignOut = async () => { await signOut(); onClose(); };
  
  const username = user?.user_metadata?.username || 'Misafir';
  const email = user?.email || '';
  const isBlocked = user?.is_blocked || false;

  const handleToggleBlock = () => {
      if (!isBlocked) {
          if (window.confirm("Hesabınızı dondurmak üzeresiniz. Oturumunuz kapanacak. Devam mı?")) {
              updateUserStatus(true);
          }
      } else {
          // Note: Usually a blocked user can't login to unblock themselves, 
          // but logic exists here for the mock user or if session is still active.
          updateUserStatus(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-neutral-950 shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Profil</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 border-4 border-white dark:border-neutral-800 ${isBlocked ? 'bg-red-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                    {username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {username}
                    {isBlocked && <span className="text-[10px] bg-red-600 text-white px-2 rounded">DONDURULDU</span>}
                </h3>
                <p className="text-sm text-neutral-500">{email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{totalCollections}</div>
                    <div className="text-xs text-neutral-500">Liste</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold text-indigo-500">{totalMovies}</div>
                    <div className="text-xs text-neutral-500">Film</div>
                </div>
            </div>

            {/* Block User Toggle */}
            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">Hesabı Dondur</div>
                    <div className="text-xs text-neutral-500">Erişimi geçici olarak kapat</div>
                </div>
                <button 
                    onClick={handleToggleBlock}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBlocked ? 'bg-red-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBlocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <button onClick={handleSignOut} className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-medium text-sm">Çıkış Yap</button>
            
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={() => { if(window.confirm('Veriler silinsin mi?')) onResetApp(); }} className="w-full py-3 text-red-500 rounded-xl font-medium text-sm">Önbelleği Temizle</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;