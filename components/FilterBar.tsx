import React from 'react';
import { Genre, SortOption } from '../types';

interface FilterBarProps {
  genres: Genre[];
  selectedGenre: number | null;
  onSelectGenre: (id: number | null) => void;
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  disabled: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  genres, 
  selectedGenre, 
  onSelectGenre,
  selectedYear,
  onSelectYear,
  currentSort,
  onSortChange,
  disabled
}) => {
  
  if (disabled) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col gap-6 mb-8">
      
      {/* Top Row: Title & Action Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tighter">
            Filmleri Keşfet
        </h2>
        
        <div className="flex items-center gap-3">
            {/* Custom Styled Select: Year */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <select 
                    value={selectedYear || ''}
                    onChange={(e) => onSelectYear(e.target.value ? parseInt(e.target.value) : null)}
                    aria-label="Yıl Filtrele"
                    className="appearance-none w-full sm:w-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors outline-none cursor-pointer"
                >
                    <option value="">Tüm Yıllar</option>
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Custom Styled Select: Sort */}
            <div className="relative group">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                </div>
                <select 
                    value={currentSort}
                    onChange={(e) => onSortChange(e.target.value as SortOption)}
                    aria-label="Sıralama Ölçütü"
                    className="appearance-none w-full sm:w-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors outline-none cursor-pointer"
                >
                    <option value="popularity.desc">Popülerlik</option>
                    <option value="vote_average.desc">Puan (Yüksek)</option>
                    <option value="primary_release_date.desc">Yeni Çıkanlar</option>
                    <option value="revenue.desc">Hasılat</option>
                </select>
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Row: Genre Pills (Horizontal Scroll) */}
      <div className="relative">
         {/* Fade effects for scroll indication */}
         <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-vista-light dark:from-vista-dark to-transparent z-10 pointer-events-none hidden md:block"></div>
         <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-vista-light dark:from-vista-dark to-transparent z-10 pointer-events-none hidden md:block"></div>
         
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 snap-x">
            <button
            onClick={() => onSelectGenre(null)}
            className={`flex-shrink-0 snap-start px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${
                selectedGenre === null
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-md'
                : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white'
            }`}
            >
            Tümü
            </button>
            
            {genres.map((genre) => (
            <button
                key={genre.id}
                onClick={() => onSelectGenre(genre.id)}
                className={`flex-shrink-0 snap-start px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${
                selectedGenre === genre.id
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-md'
                    : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
                {genre.name}
            </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;