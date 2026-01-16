import React, { useState, useMemo } from 'react';
import { Movie } from '../../types';
import { IMAGE_BASE_URL } from '../../services/tmdbService';

interface FavoriteSelectorModalProps {
  collectionMovies: Movie[];
  slotIndex: number;
  onSelect: (movieId: number) => void;
  onClear: () => void;
  onClose: () => void;
}

const FavoriteSelectorModal: React.FC<FavoriteSelectorModalProps> = ({ 
  collectionMovies, 
  slotIndex, 
  onSelect,
  onClear,
  onClose 
}) => {
  const [search, setSearch] = useState('');

  const filteredMovies = useMemo(() => {
    if (!search) return collectionMovies;
    const lower = search.toLowerCase();
    return collectionMovies.filter(m => 
        (m.title || m.name || '').toLowerCase().includes(lower)
    );
  }, [collectionMovies, search]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[80vh] overflow-hidden animate-slide-in-up">
            
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 z-10">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {slotIndex < 3 ? `#${slotIndex + 1} Numaralı Favorini Seç` : 'Bonus Filmini Seç'}
                    </h3>
                    <p className="text-xs text-neutral-500">Koleksiyonundan bir yapım seç</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Film ara..."
                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                        autoFocus
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredMovies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                        <p>Koleksiyonunda bu isimde bir film bulunamadı.</p>
                        <p className="text-xs mt-2">Önce "Keşfet" sayfasından film eklemelisin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredMovies.map(movie => (
                            <div 
                                key={movie.id}
                                onClick={() => onSelect(movie.id)}
                                className="cursor-pointer group relative"
                            >
                                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                                    <img 
                                        src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://placehold.co/300x450'} 
                                        alt={movie.title || movie.name}
                                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            Seç
                                        </span>
                                    </div>
                                </div>
                                <h4 className="mt-2 text-xs font-medium text-neutral-900 dark:text-white truncate text-center">
                                    {movie.title || movie.name}
                                </h4>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Action (Clear) */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-center">
                <button 
                    onClick={onClear}
                    className="text-red-500 text-sm font-medium hover:underline flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Bu slotu temizle
                </button>
            </div>
        </div>
    </div>
  );
};

export default FavoriteSelectorModal;