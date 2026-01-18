
import React, { useState, useEffect } from 'react';
import { Collection } from '../../types';
import { useCollectionContext } from '../../context/CollectionContext';
import { useToast } from '../../context/ToastContext';

interface ListSettingsModalProps {
  collection: Collection;
  onClose: () => void;
}

type SettingsTab = 'GENERAL' | 'SHARING';

const ListSettingsModal: React.FC<ListSettingsModalProps> = ({ collection, onClose }) => {
  const { updateCollectionSettings, regenerateToken, deleteCollection } = useCollectionContext();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  
  // Local Form State
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');
  const [isPublic, setIsPublic] = useState(collection.isPublic || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(collection.name);
    setDescription(collection.description || '');
    setIsPublic(collection.isPublic || false);
  }, [collection]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateCollectionSettings(collection.id, { name, description, isPublic });
    setLoading(false);
  };

  const handleTogglePublic = async () => {
      const newState = !isPublic;
      setIsPublic(newState);
      // Anında kaydet
      await updateCollectionSettings(collection.id, { name, description, isPublic: newState });
  };

  const handleRegenerate = async () => {
      if(window.confirm('Yeni bir bağlantı oluşturursanız eskisi çalışmaz. Emin misiniz?')) {
          setLoading(true);
          await regenerateToken(collection.id);
          setLoading(false);
      }
  };

  const handleDelete = async () => {
      if(window.confirm(`"${name}" listesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
          deleteCollection(collection.id);
          onClose();
      }
  };

  const copyLink = () => {
      if (!collection.shareToken) return;
      const link = `${window.location.origin}/?collection=${collection.shareToken}`;
      navigator.clipboard.writeText(link);
      showToast('Bağlantı kopyalandı', 'success');
  };

  const renderTabButton = (tab: SettingsTab, label: string, icon: React.ReactNode) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === tab 
            ? 'text-neutral-900 dark:text-white' 
            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }`}
    >
        {icon}
        <span>{label}</span>
        {activeTab === tab && (
            <div className="absolute bottom-0 w-1/2 h-0.5 bg-neutral-900 dark:bg-white rounded-t-full"></div>
        )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-950 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-slide-in-up overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Liste Ayarları</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800">
            {renderTabButton('GENERAL', 'Genel', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>)}
            {renderTabButton('SHARING', 'Paylaşım', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>)}
        </div>

        <div className="p-6">
            {/* GENEL TAB */}
            {activeTab === 'GENERAL' && (
                <form onSubmit={handleSaveGeneral} className="space-y-5 animate-fade-in">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Liste Adı</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none font-bold"
                            placeholder="Örn: Favorilerim"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Açıklama (Opsiyonel)</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full h-24 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-transparent focus:border-indigo-500 outline-none resize-none"
                            placeholder="Bu listenin hikayesi nedir?"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !name.trim()}
                        className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    
                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                        <button 
                            type="button"
                            onClick={handleDelete}
                            className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-colors text-sm"
                        >
                            Bu Listeyi Sil
                        </button>
                    </div>
                </form>
            )}

            {/* PAYLAŞIM TAB */}
            {activeTab === 'SHARING' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Herkese Açık Paylaşım</h3>
                            <p className="text-xs text-neutral-500 mt-1">Bağlantıya sahip olan herkes görebilir.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isPublic} onChange={handleTogglePublic} className="sr-only peer" />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {isPublic ? (
                        <div className="animate-slide-in-up">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Paylaşım Bağlantısı</label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly
                                    value={collection.shareToken ? `${window.location.origin}/?collection=${collection.shareToken}` : 'Bağlantı oluşturuluyor...'}
                                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs border border-transparent outline-none truncate"
                                />
                                <button 
                                    onClick={copyLink}
                                    className="px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors"
                                >
                                    Kopyala
                                </button>
                            </div>
                            
                            <div className="mt-4 flex justify-center">
                                <button 
                                    onClick={handleRegenerate}
                                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
                                >
                                    Bağlantıyı Sıfırla (Eski link iptal olur)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 opacity-50">
                            <svg className="w-12 h-12 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p className="text-sm font-medium">Paylaşım Kapalı</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ListSettingsModal;
