
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useToast } from '../context/ToastContext';
import { useCollectionContext } from '../context/CollectionContext';

interface DashboardHeaderProps {
  collections: any[]; 
  activeCollectionId: string;
  onSwitchCollection: (id: string) => void;
  onCreateCollection: (name: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  collections, 
  activeCollectionId, 
  onSwitchCollection,
  onCreateCollection
}) => {
  const { updateCollectionSettings, regenerateToken, deleteCollection } = useCollectionContext();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const movieCount = activeCollection?.movies.length || 0;

  // Koleksiyon değiştiğinde form verilerini senkronize et
  useEffect(() => {
    if (activeCollection) {
        setEditName(activeCollection.name);
        setEditDesc(activeCollection.description || '');
        setEditIsPublic(activeCollection.isPublic || false);
        setIsEditing(false); // Başka listeye geçince edit modunu kapat
    }
  }, [activeCollectionId, activeCollection]);

  const handleCreateClick = () => {
    if (!user) {
        showToast('Liste oluşturmak için giriş yapmalısınız.', 'info');
        openAuthModal();
        return;
    }
    setIsCreating(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onCreateCollection(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const toggleEditMode = () => {
    if (!user) {
        showToast('Ayarları yönetmek için giriş yapmalısınız.', 'info');
        openAuthModal();
        return;
    }
    // Edit modunu aç/kapa yaparken verileri resetle
    if (!isEditing && activeCollection) {
        setEditName(activeCollection.name);
        setEditDesc(activeCollection.description || '');
        setEditIsPublic(activeCollection.isPublic || false);
    }
    setIsEditing(!isEditing);
  }

  const handleSaveSettings = async () => {
      if (!activeCollection) return;
      setIsSaving(true);
      await updateCollectionSettings(activeCollection.id, {
          name: editName,
          description: editDesc,
          isPublic: editIsPublic
      });
      setIsSaving(false);
      setIsEditing(false);
  };

  const handleDelete = async () => {
      if (!activeCollection) return;
      if (window.confirm(`"${activeCollection.name}" listesini silmek istediğinize emin misiniz?`)) {
          deleteCollection(activeCollection.id);
          setIsEditing(false);
      }
  };

  const handleCopyLink = () => {
      if (!activeCollection?.shareToken) return;
      const link = `${window.location.origin}/?collection=${activeCollection.shareToken}`;
      navigator.clipboard.writeText(link);
      showToast('Bağlantı kopyalandı', 'success');
  };

  const handleRegenerate = async () => {
      if (!activeCollection) return;
      if(window.confirm('Mevcut bağlantı iptal edilecek. Devam edilsin mi?')) {
          await regenerateToken(activeCollection.id);
      }
  };

  return (
    <div className="mb-8 flex flex-col gap-6 animate-fade-in">
      
      {/* Top Bar: Tabs & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* List Tabs */}
        <div className="flex flex-wrap items-center gap-2">
            {collections.map(col => (
                <button
                    key={col.id}
                    onClick={() => onSwitchCollection(col.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                        activeCollectionId === col.id
                        ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-black'
                        : 'bg-transparent border-neutral-200 text-neutral-500 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                >
                    {col.name}
                </button>
            ))}
            
            {/* Create Button */}
            {!isCreating ? (
                <button 
                    onClick={handleCreateClick}
                    className="p-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            ) : (
                <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 animate-slide-in-right">
                    <input 
                        type="text" 
                        autoFocus
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        placeholder="İsim..."
                        className="px-3 py-2 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm outline-none border border-neutral-300 dark:border-neutral-700"
                    />
                    <button type="submit" className="text-green-600 hover:text-green-700">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => setIsCreating(false)} className="text-red-500 hover:text-red-600">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </form>
            )}
        </div>

        {/* Settings Toggle Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
            <button 
                onClick={toggleEditMode}
                className={`p-2.5 rounded-xl transition-colors border-2 ${
                    isEditing 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' 
                    : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title="Listeyi Düzenle"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
      </div>

      {/* Main Info / Edit Panel */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isEditing 
          ? 'bg-white dark:bg-neutral-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
          : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
      }`}>
          {!isEditing ? (
              /* --- VIEW MODE --- */
              <div className="flex justify-between items-start animate-fade-in">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                        {activeCollection?.name}
                    </h2>
                    {activeCollection?.description && (
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-2 max-w-xl leading-relaxed">
                            {activeCollection.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] font-bold text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">
                            {movieCount === 0 ? "Boş Liste" : `${movieCount} İçerik`}
                        </span>
                        {activeCollection?.isPublic && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded border border-green-200 dark:border-green-800">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Herkese Açık
                            </span>
                        )}
                    </div>
                </div>
              </div>
          ) : (
              /* --- EDIT MODE --- */
              <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col gap-4">
                      {/* Name Input */}
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Liste Adı</label>
                          <input 
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 outline-none font-bold"
                          />
                      </div>
                      
                      {/* Description Input */}
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Açıklama</label>
                          <textarea 
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            className="w-full h-20 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 outline-none text-sm resize-none"
                            placeholder="Bu liste hakkında..."
                          />
                      </div>
                  </div>
                  
                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 w-full my-4"></div>

                  <div className="flex flex-col md:flex-row gap-6">
                      {/* Public Toggle */}
                      <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                             <div>
                                <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Paylaşım Durumu</h3>
                                <p className="text-[10px] text-neutral-500">Açık olduğunda link ile erişilebilir.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={editIsPublic} onChange={() => setEditIsPublic(!editIsPublic)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                             </label>
                          </div>
                          
                          {/* Share Link Area (Conditional) */}
                          {editIsPublic && activeCollection?.shareToken && (
                              <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                                  <input 
                                    readOnly
                                    value={`${window.location.origin}/?collection=${activeCollection.shareToken}`}
                                    className="flex-1 bg-transparent text-[10px] text-neutral-600 dark:text-neutral-400 outline-none"
                                  />
                                  <button onClick={handleCopyLink} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">Kopyala</button>
                                  <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600"></div>
                                  <button onClick={handleRegenerate} title="Link Yenile" className="text-neutral-400 hover:text-neutral-600">
                                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  </button>
                              </div>
                          )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-end gap-3 justify-end">
                          <button 
                            onClick={handleDelete}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                          >
                              Listeyi Sil
                          </button>
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                              İptal
                          </button>
                          <button 
                            onClick={handleSaveSettings}
                            disabled={isSaving || !editName.trim()}
                            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                          >
                              {isSaving ? '...' : 'Kaydet'}
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>

    </div>
  );
};

export default DashboardHeader;
