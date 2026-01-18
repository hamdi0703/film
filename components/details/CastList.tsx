import React, { useState } from 'react';
import { Cast } from '../../types';

// Performance: Use smaller image size for avatars instead of full poster size
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

interface CastListProps {
  cast?: Cast[];
}

const CastList: React.FC<CastListProps> = ({ cast }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!cast || cast.length === 0) return null;

  // UX Decision: 6 items creates a perfect single row on desktop (cleaner look)
  // 12 items creates two perfect rows. Let's use 12 to show enough context without clutter.
  const INITIAL_DISPLAY_COUNT = 12;
  
  const visibleCast = isExpanded ? cast : cast.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = cast.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest">
                Oyuncular <span className="text-neutral-400 text-xs ml-1 font-medium">{cast.length}</span>
            </h3>
        </div>

        {/* 
            GRID SYSTEM:
            - Mobile: 2 cols (Spacious)
            - Tablet: 3 or 4 cols
            - Desktop: 6 cols (Optimal for readability & spacing, better than 8)
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
            {visibleCast.map(actor => (
                <div key={actor.id} className="flex flex-col items-center text-center group">
                    
                    {/* Avatar Container */}
                    <div className="relative mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-sm ring-2 ring-transparent group-hover:ring-indigo-500/30 group-hover:shadow-lg transition-all duration-300">
                            {actor.profile_path ? (
                                <img 
                                    src={`${PROFILE_BASE_URL}${actor.profile_path}`} 
                                    alt={actor.name} 
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-400">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Info */}
                    <div className="w-full px-1">
                        <div className="text-sm font-bold text-neutral-900 dark:text-white truncate leading-tight mb-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={actor.name}>
                            {actor.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-medium" title={actor.character}>
                            {actor.character}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Expand Button */}
        {hasMore && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group flex items-center gap-2 px-8 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-white transition-all duration-300"
                >
                    <span>{isExpanded ? 'Daha Az Göster' : 'Tüm Oyuncuları Göster'}</span>
                    <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        )}
    </div>
  );
};

export default CastList;