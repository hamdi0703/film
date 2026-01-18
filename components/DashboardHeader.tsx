import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import Auth Logic
import { useToast } from '../context/ToastContext';

interface DashboardHeaderProps {
  collections: any[]; 
  activeCollectionId: string;
  onSwitchCollection: (id: string) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onShare: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  collections, 
  activeCollectionId, 
  onSwitchCollection,
  onCreateCollection,
  onDeleteCollection,
  onShare
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [copied, setCopied] = useState(false);

  const { user, openAuthModal } = useAuth(); // Auth hook
  const { showToast } = useToast();

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const movieCount = activeCollection?.movies.length || 0;

  // --- LOGIC: RESTRICT CREATION ---
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

  // --- LOGIC: RESTRICT SHARING ---
  const handleShareClick = () => {
    if (!user) {
        showToast('Koleksiyon paylaşmak için giriş yapmalısınız.', 'info');
        openAuthModal();
        return;
    }

    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-8 flex flex-col gap-6">
      
      {/* Top Bar: List Selector and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* List Selector (Tabs) */}
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
                    aria-label="Yeni Liste Oluştur"
                    className="p-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 transition-colors"
                    title="Yeni Liste Oluştur"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            ) : (
                <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        autoFocus
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        placeholder="Liste adı..."
                        aria-label="Liste Adı"
                        className="px-3 py-2 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm outline-none border border-neutral-300 dark:border-neutral-700"
                    />
                    <button type="submit" aria-label="Kaydet" className="text-green-600 hover:text-green-700">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button type="button" aria-label="İptal" onClick={() => setIsCreating(false)} className="text-red-500 hover:text-red-600">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </form>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Share Button */}
            {movieCount > 0 && (
                 <button
                 onClick={handleShareClick}
                 aria-label="Listeyi Paylaş"
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all shadow-md"
             >
                 {copied ? (
                     <>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         <span>Kopyalandı</span>
                     </>
                 ) : (
                     <>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                         </svg>
                         <span>Paylaş</span>
                     </>
                 )}
             </button>
            )}

            {/* Delete Button (Don't allow deleting the last remaining list) */}
            {collections.length > 1 && (
                <button 
                    onClick={() => onDeleteCollection(activeCollectionId)}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                    title="Bu listeyi sil"
                    aria-label="Bu listeyi sil"
                >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
              {activeCollection?.name}
          </h2>
          <p className="text-neutral-500 text-sm">
            {movieCount === 0 
              ? "Bu liste boş. Film eklemek için Keşfet sayfasına git." 
              : `${movieCount} film koleksiyonunda.`}
          </p>
      </div>

    </div>
  );
};

export default DashboardHeader;