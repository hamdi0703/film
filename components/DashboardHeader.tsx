
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useToast } from '../context/ToastContext';
import ListSettingsModal from './dashboard/ListSettingsModal';

interface DashboardHeaderProps {
  collections: any[]; 
  activeCollectionId: string;
  onSwitchCollection: (id: string) => void;
  onCreateCollection: (name: string) => void;
  // delete ve share prop'ları artık modal içinde yönetiliyor
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  collections, 
  activeCollectionId, 
  onSwitchCollection,
  onCreateCollection
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const movieCount = activeCollection?.movies.length || 0;

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

  const handleSettingsClick = () => {
    if (!user) {
        showToast('Ayarları yönetmek için giriş yapmalısınız.', 'info');
        openAuthModal();
        return;
    }
    setIsSettingsOpen(true);
  }

  return (
    <div className="mb-8 flex flex-col gap-6">
      
      {isSettingsOpen && activeCollection && (
          <ListSettingsModal 
            collection={activeCollection} 
            onClose={() => setIsSettingsOpen(false)} 
          />
      )}

      {/* Top Bar */}
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
                <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Settings Button (Replaces Share/Delete) */}
            <button 
                onClick={handleSettingsClick}
                className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Liste Ayarları"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                    {activeCollection?.name}
                </h2>
                {activeCollection?.description && (
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-2 max-w-xl">
                        {activeCollection.description}
                    </p>
                )}
                <p className="text-neutral-500 text-xs">
                    {movieCount === 0 
                    ? "Liste boş." 
                    : `${movieCount} içerik.`}
                </p>
            </div>
            {activeCollection?.isPublic && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded-md border border-green-200 dark:border-green-800">
                    Herkese Açık
                </span>
            )}
          </div>
      </div>

    </div>
  );
};

export default DashboardHeader;
