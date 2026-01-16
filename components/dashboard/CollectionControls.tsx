import React from 'react';
import { Genre } from '../../types';

export type SortOptionType = 'added_desc' | 'added_asc' | 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'runtime_desc' | 'runtime_asc' | 'title_asc' | 'votes_desc';
export type GroupOptionType = 'none' | 'year' | 'genre' | 'director' | 'actor' | 'runtime' | 'rating';
export type FilterStatusType = 'all' | 'rated' | 'reviewed';

interface CollectionControlsProps {
  genres: Genre[];
  
  // Sorting
  currentSort: SortOptionType;
  onSortChange: (opt: SortOptionType) => void;
  
  // Filtering
  filterGenre: number | null;
  onFilterGenreChange: (id: number | null) => void;
  filterYear: number | null;
  onFilterYearChange: (year: number | null) => void;
  filterMinRating: number | null;
  onFilterMinRatingChange: (rating: number | null) => void;
  
  filterStatus: FilterStatusType;
  onFilterStatusChange: (status: FilterStatusType) => void;

  // Grouping
  currentGroup: GroupOptionType;
  onGroupChange: (opt: GroupOptionType) => void;
  
  resultCount: number;
}

const CollectionControls: React.FC<CollectionControlsProps> = ({
  genres,
  currentSort,
  onSortChange,
  filterGenre,
  onFilterGenreChange,
  filterYear,
  onFilterYearChange,
  filterMinRating,
  onFilterMinRatingChange,
  filterStatus,
  onFilterStatusChange,
  currentGroup,
  onGroupChange,
  resultCount
}) => {
  
  // Generate Year Options (1960 - Current)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-8 shadow-sm flex flex-col gap-4">
      
      {/* Top Row: Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* 1. SORT */}
            <ControlDropdown 
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
                value={currentSort}
                onChange={(val) => onSortChange(val as SortOptionType)}
                options={[
                    { label: 'Eklenme (Yeni → Eski)', value: 'added_desc' },
                    { label: 'Eklenme (Eski → Yeni)', value: 'added_asc' },
                    { label: 'Tarih (Yeni → Eski)', value: 'date_desc' },
                    { label: 'Tarih (Eski → Yeni)', value: 'date_asc' },
                    { label: 'Puan (Yüksek → Düşük)', value: 'rating_desc' },
                    { label: 'Puan (Düşük → Yüksek)', value: 'rating_asc' },
                    { label: 'Popülerlik (Oylama)', value: 'votes_desc' },
                    { label: 'Süre (Uzun → Kısa)', value: 'runtime_desc' },
                    { label: 'Süre (Kısa → Uzun)', value: 'runtime_asc' },
                    { label: 'İsim (A → Z)', value: 'title_asc' },
                ]}
                active={true}
            />

            {/* 2. GROUPING */}
            <ControlDropdown 
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
                value={currentGroup}
                onChange={(val) => onGroupChange(val as GroupOptionType)}
                options={[
                    { label: 'Gruplama: Yok', value: 'none' },
                    { label: 'Gruplama: Türe Göre', value: 'genre' },
                    { label: 'Gruplama: Yıla Göre', value: 'year' },
                    { label: 'Gruplama: Yönetmen', value: 'director' },
                    { label: 'Gruplama: Başrol Oyuncusu', value: 'actor' },
                    { label: 'Gruplama: Süre (Kısa/Uzun)', value: 'runtime' },
                    { label: 'Gruplama: Kalite (Puan)', value: 'rating' },
                ]}
                active={currentGroup !== 'none'}
                activeColorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30"
            />
        </div>

        {/* Count Badge */}
        <div className="text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full self-start lg:self-center">
            {resultCount} Film
        </div>
      </div>

      <div className="h-px bg-neutral-100 dark:bg-neutral-800 w-full" />

      {/* Bottom Row: Filters */}
      <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-2">Filtrele:</span>
          
          {/* Status Filter (NEW) */}
           <ControlDropdown 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            value={filterStatus}
            onChange={(val) => onFilterStatusChange(val as FilterStatusType)}
            options={[
                { label: 'Tümü', value: 'all' },
                { label: 'Puanladıklarım', value: 'rated' },
                { label: 'İnceleme Yazdıklarım', value: 'reviewed' },
            ]}
            active={filterStatus !== 'all'}
            activeColorClass="text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30"
          />

          {/* Genre Filter */}
          <ControlDropdown 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
            value={filterGenre || ''}
            onChange={(val) => onFilterGenreChange(val ? parseInt(val) : null)}
            options={[
                { label: 'Tüm Türler', value: '' },
                ...genres.map(g => ({ label: g.name, value: g.id }))
            ]}
            active={!!filterGenre}
            activeColorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30"
          />

          {/* Year Filter */}
          <ControlDropdown 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            value={filterYear || ''}
            onChange={(val) => onFilterYearChange(val ? parseInt(val) : null)}
            options={[
                { label: 'Tüm Yıllar', value: '' },
                ...years.map(y => ({ label: y.toString(), value: y }))
            ]}
            active={!!filterYear}
            activeColorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30"
          />

          {/* Rating Filter */}
           <ControlDropdown 
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            value={filterMinRating || ''}
            onChange={(val) => onFilterMinRatingChange(val ? parseInt(val) : null)}
            options={[
                { label: 'Tüm Puanlar', value: '' },
                { label: '9+ Puan', value: 9 },
                { label: '8+ Puan', value: 8 },
                { label: '7+ Puan', value: 7 },
                { label: '6+ Puan', value: 6 },
            ]}
            active={!!filterMinRating}
            activeColorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30"
          />
      </div>

    </div>
  );
};

// --- Reusable Internal Dropdown Component for Clean Code ---
const ControlDropdown = ({ 
    icon, 
    value, 
    onChange, 
    options, 
    active, 
    activeColorClass = "text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800" 
}: {
    icon: React.ReactNode,
    value: string | number,
    onChange: (val: string) => void,
    options: { label: string, value: string | number }[],
    active: boolean,
    activeColorClass?: string
}) => (
    <div className="relative group">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${active ? activeColorClass : 'text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
            <span className={active ? '' : 'opacity-70'}>{icon}</span>
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-transparent border-none outline-none text-xs font-bold appearance-none cursor-pointer pr-6 py-0.5 ${active ? 'opacity-100' : 'opacity-70'}`}
            >
                {options.map((opt, idx) => (
                    <option key={idx} value={opt.value} className="text-black">{opt.label}</option>
                ))}
            </select>
            <div className={`absolute right-2 pointer-events-none ${active ? 'opacity-100' : 'opacity-50'}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

export default CollectionControls;