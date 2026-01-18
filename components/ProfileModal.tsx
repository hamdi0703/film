import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionContext } from '../context/CollectionContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AVATAR_PERSONAS, getAvatarUrl, getAvatarPersona } from '../utils/avatarUtils';

export type ProfileTab = 'PROFILE' | 'SECURITY' | 'STATS';

interface ProfileModalProps {
  onClose: () => void;
  onResetApp: () => void;
  initialTab?: ProfileTab;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onResetApp, initialTab = 'PROFILE' }) => {
  const { collections } = useCollectionContext();
  const { user, signOut, updateProfile, updatePassword, deleteAccount, updateUserStatus } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [loading, setLoading] = useState(false);

  // Form States
  const [username, setUsername] = useState('');
  
  // Burada artık URL değil, ID tutuyoruz (örn: '1', '2')
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('1'); 
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Init Data
  useEffect(() => {
    if (user) {
        setUsername(user.user_metadata?.username || '');
        // Veritabanından gelen değeri al, yoksa '1' yap
        const currentAvatar = user.user_metadata?.avatar_url;
        setSelectedAvatarId(currentAvatar && !currentAvatar.startsWith('http') ? currentAvatar : '1');
    }
  }, [user]);

  // Date Formatting for Join Date
  const joinDate = useMemo(() => {
    if (!user?.created_at) return null;
    return new Date(user.created_at).toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long',
        day: 'numeric' 
    });
  }, [user]);

  const totalMovies = collections.reduce((acc, col) => acc + col.movies.length, 0);
  const currentPersona = getAvatarPersona(selectedAvatarId);

  // Handlers
  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Sadece ID'yi kaydediyoruz
          await updateProfile(username, selectedAvatarId);
      } catch (error: any) {
          showToast(error.message, 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          showToast('Şifreler eşleşmiyor', 'error');
          return;
      }
      if (newPassword.length < 6) {
          showToast('Şifre en az 6 karakter olmalı', 'error');
          return;
      }
      setLoading(true);
      try {
          await updatePassword(newPassword);
          setNewPassword('');
          setConfirmPassword('');
      } catch (error: any) {
          showToast(error.message, 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteAccount = async () => {
      if (window.confirm('BU İŞLEM GERİ ALINAMAZ! Hesabınızı ve tüm verilerinizi silmek istediğinize emin misiniz?')) {
          setLoading(true);
          await deleteAccount();
          onClose();
      }
  };

  const handleSignOut = async () => {
      await signOut();
      onClose();
  };

  // Render Helpers
  const renderTabButton = (tab: ProfileTab, label: string, icon: React.ReactNode) => (
      <button
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-3 text-sm font-bold flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === tab 
              ? 'text-indigo-600 dark:text-white' 
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
      >
          {icon}
          <span>{label}</span>
          {activeTab === tab && (
              <div className="absolute bottom-0 w-full h-0.5 bg-indigo-600 dark:bg-white rounded-t-full"></div>
          )}
      </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-neutral-950 shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-950 z-10">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Ayarlar</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* User Quick Info */}
        <div className="px-6 pt-6 pb-2 text-center">
            {/* Dynamic Background based on Persona */}
            <div 
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-xl mb-3 overflow-hidden border-4 border-white dark:border-neutral-800 relative transition-all duration-500"
                style={{ background: `linear-gradient(135deg, ${currentPersona.bgStart}, ${currentPersona.bgEnd})` }}
            >
                <img 
                    src={getAvatarUrl(selectedAvatarId)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover transform scale-90" 
                />
            </div>
            
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{username || user?.email}</h3>
            
            {/* User Email */}
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {user?.email}
            </p>

            {/* Join Date */}
            {joinDate && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 mb-3 opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Katılım: {joinDate}</span>
                </div>
            )}
            
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {currentPersona.name}
            </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-2 mt-4">
            {renderTabButton('PROFILE', 'Profil', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>)}
            {renderTabButton('SECURITY', 'Güvenlik', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>)}
            {renderTabButton('STATS', 'İstatistik', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>)}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            
            {/* --- PROFILE TAB --- */}
            {activeTab === 'PROFILE' && (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Kullanıcı Adı</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>
                    
                    {/* Avatar Selection Grid */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Bir Kişilik Seçin</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {AVATAR_PERSONAS.map((persona) => (
                                <button
                                    key={persona.id}
                                    type="button"
                                    onClick={() => setSelectedAvatarId(persona.id)}
                                    className={`relative flex items-center p-2 rounded-xl border-2 transition-all duration-200 group text-left ${
                                        selectedAvatarId === persona.id 
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                        : 'border-transparent bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-200 dark:hover:border-neutral-800'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 overflow-hidden flex-shrink-0 mr-3 shadow-sm">
                                         <img 
                                            src={getAvatarUrl(persona.id)}
                                            alt={persona.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-bold truncate ${selectedAvatarId === persona.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-900 dark:text-white'}`}>
                                            {persona.name}
                                        </div>
                                        <div className="text-[9px] text-neutral-500 truncate">
                                            {persona.description}
                                        </div>
                                    </div>
                                    {selectedAvatarId === persona.id && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </form>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'SECURITY' && (
                <div className="space-y-8 animate-fade-in">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Şifre Değiştir</h3>
                        <div>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Yeni Şifre"
                                className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Şifreyi Onayla"
                                className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!newPassword || loading} 
                            className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                        >
                            Şifreyi Güncelle
                        </button>
                    </form>

                    <div className="pt-4 space-y-4">
                        <h3 className="text-sm font-bold text-red-500 border-b border-neutral-100 dark:border-neutral-800 pb-2">Tehlikeli Bölge</h3>
                         
                        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Hesabı Dondur</span>
                            <button 
                                onClick={() => updateUserStatus(!user?.is_blocked)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${user?.is_blocked ? 'bg-red-100 text-red-600' : 'bg-neutral-200 text-neutral-600'}`}
                            >
                                {user?.is_blocked ? 'Aktif Et' : 'Dondur'}
                            </button>
                        </div>

                        <button 
                            onClick={handleDeleteAccount}
                            className="w-full py-3 border border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Hesabımı Sil
                        </button>
                    </div>
                </div>
            )}

            {/* --- STATS TAB --- */}
            {activeTab === 'STATS' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl text-center border border-neutral-100 dark:border-neutral-800">
                            <div className="text-3xl font-bold text-neutral-900 dark:text-white">{collections.length}</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wide mt-1">Koleksiyon</div>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl text-center border border-neutral-100 dark:border-neutral-800">
                            <div className="text-3xl font-bold text-indigo-500">{totalMovies}</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wide mt-1">Toplam İçerik</div>
                        </div>
                    </div>
                    
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Uygulama Verileri</h4>
                        <button onClick={() => { if(window.confirm('Önbellek temizlensin mi?')) onResetApp(); }} className="text-xs text-red-500 hover:underline">
                            Yerel Önbelleği Temizle
                        </button>
                        <p className="text-[10px] text-neutral-400 mt-2">
                            Bu işlem sadece tarayıcınızdaki geçici verileri temizler. Hesabınızdaki veriler silinmez.
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <button 
                onClick={handleSignOut} 
                className="w-full py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
                Çıkış Yap
            </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;