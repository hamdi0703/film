import React, { useMemo, useState } from 'react';
import { useCollectionContext } from '../../context/CollectionContext';
import { useReviewContext } from '../../context/ReviewContext'; // Reviews eklendi
import { Movie, Genre, MediaType } from '../../types';
import MovieCard from '../MovieCard';
import { useAuth } from '../../context/AuthContext';
import MediaTypeNavbar from '../MediaTypeNavbar';
import CollectionAnalytics from '../analytics/CollectionAnalytics';
import TopFavorites from '../dashboard/TopFavorites';
import ErrorBoundary from '../ErrorBoundary';
import { useTheme } from '../../context/ThemeContext';
import CollectionControls, { SortOptionType, GroupOptionType, FilterStatusType } from '../dashboard/CollectionControls';

interface SharedListViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
  onBack: () => void;
}

type TabOption = 'movie' | 'tv';

const SharedListView: React.FC<SharedListViewProps> = ({ onSelectMovie, genres, onBack }) => {
  const { sharedList } = useCollectionContext();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { reviews } = useReviewContext(); // İzleyicinin kendi reviewları
  
  // --- View Control State ---
  const [activeTab, setActiveTab] = useState<TabOption>('movie');
  const [sortOption, setSortOption] = useState<SortOptionType>('date_desc'); // Shared list için varsayılan tarih
  const [groupOption, setGroupOption] = useState<GroupOptionType>('none');
  
  // Filter States
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('all');

  const allMovies = useMemo(() => sharedList?.movies || [], [sharedList]);

  // --- HELPER: Safe Date Parsing ---
  const getSafeYear = (dateString?: string): number | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.getFullYear();
  };

  // --- HELPER: Total Runtime Calculation ---
  const getTotalRuntime = (m: Movie): number => {
      if (m.name || m.first_air_date) {
          const episodes = m.number_of_episodes || 1;
          const runtime = (m.episode_run_time && m.episode_run_time.length > 0) 
            ? m.episode_run_time[0] 
            : (m.runtime || 0);
          return episodes * runtime;
      }
      return m.runtime || 0;
  };

  // 1. Tab Filtering (Strict Binary Filter)
  const tabFilteredMovies = useMemo(() => {
      return allMovies.filter(m => {
          const isTv = !!(m.name || m.first_air_date);
          return activeTab === 'tv' ? isTv : !isTv;
      });
  }, [allMovies, activeTab]);

  // --- DATA PIPELINE (Dashboard ile Aynı Mantık) ---
  const processedData = useMemo(() => {
    let result = [...tabFilteredMovies];

    // 1. ADVANCED FILTERING
    if (filterStatus === 'rated') {
        result = result.filter(m => { const r = reviews[m.id]; return r && r.rating > 0; });
    } else if (filterStatus === 'reviewed') {
        result = result.filter(m => { const r = reviews[m.id]; return r && r.comment && r.comment.trim().length > 0; });
    }

    if (filterGenre) {
        result = result.filter(m => {
            const movieGenreIds = m.genre_ids || m.genres?.map(g => g.id) || [];
            return movieGenreIds.includes(filterGenre);
        });
    }

    if (filterYear) {
        result = result.filter(m => {
            const date = m.release_date || m.first_air_date;
            const year = getSafeYear(date);
            return year === filterYear;
        });
    }

    if (filterMinRating) {
        result = result.filter(m => (m.vote_average || 0) >= filterMinRating);
    }

    // 2. SORTING
    result.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date;
        const dateB = b.release_date || b.first_air_date;
        
        const ratingA = a.vote_average || 0;
        const ratingB = b.vote_average || 0;
        
        const runtimeA = getTotalRuntime(a);
        const runtimeB = getTotalRuntime(b);
        
        const titleA = a.title || a.name || '';
        const titleB = b.title || b.name || '';

        const addedA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const addedB = b.addedAt ? new Date(b.addedAt).getTime() : 0;

        switch (sortOption) {
            case 'added_desc': return addedB - addedA;
            case 'added_asc': return addedA - addedB;
            case 'date_desc': return (dateB || '').localeCompare(dateA || '');
            case 'date_asc': return (dateA || '').localeCompare(dateB || '');
            case 'rating_desc': return ratingB - ratingA;
            case 'rating_asc': return ratingA - ratingB;
            case 'runtime_desc': return runtimeB - runtimeA;
            case 'runtime_asc': return runtimeA - runtimeB;
            case 'title_asc': return titleA.localeCompare(titleB);
            case 'votes_desc': return ratingB - ratingA;
            default: return 0;
        }
    });

    // 3. GROUPING STRATEGIES
    const grouped: Record<string, Movie[]> = {};

    if (groupOption === 'none') {
        const label = activeTab === 'movie' ? 'Filmler' : 'Diziler';
        grouped[label] = result;
    } else {
        result.forEach(movie => {
            let key = 'Diğer';
            
            if (groupOption === 'year') {
                const date = movie.release_date || movie.first_air_date;
                const year = getSafeYear(date);
                key = year ? year.toString() : 'Tarihsiz';
            } else if (groupOption === 'genre') {
                const movieGenreIds = movie.genre_ids || movie.genres?.map(g => g.id) || [];
                const primaryGenreId = movieGenreIds[0];
                if (primaryGenreId) {
                    key = genres.find(g => g.id === primaryGenreId)?.name || 'Diğer';
                }
            } else if (groupOption === 'director') {
                const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name;
                const creator = movie.created_by?.[0]?.name;
                key = director || creator || 'Yönetmen Bilinmiyor';
            } else if (groupOption === 'actor') {
                const leadActor = movie.credits?.cast?.[0]?.name;
                key = leadActor || 'Oyuncu Bilinmiyor';
            } else if (groupOption === 'runtime') {
                const runtime = getTotalRuntime(movie);
                if (runtime === 0) key = 'Bilinmiyor';
                else if (runtime < 90) key = 'Kısa (< 90 dk)';
                else if (runtime <= 120) key = 'Standart (90 - 120 dk)';
                else key = 'Uzun (> 120 dk)';
            } else if (groupOption === 'rating') {
                const rate = movie.vote_average || 0;
                if (rate >= 9) key = 'Başyapıt (9+)';
                else if (rate >= 8) key = 'Harika (8-9)';
                else if (rate >= 7) key = 'İyi (7-8)';
                else if (rate >= 5) key = 'Ortalama (5-7)';
                else key = 'Düşük Puan (< 5)';
            }

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(movie);
        });
    }

    let sortedKeys = Object.keys(grouped);
    
    if (groupOption === 'year') {
        sortedKeys.sort((a, b) => b.localeCompare(a));
    } else if (groupOption === 'rating') {
        const order = ['Başyapıt (9+)', 'Harika (8-9)', 'İyi (7-8)', 'Ortalama (5-7)', 'Düşük Puan (< 5)', 'Diğer'];
        sortedKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else if (groupOption === 'runtime') {
        const order = ['Kısa (< 90 dk)', 'Standart (90 - 120 dk)', 'Uzun (> 120 dk)', 'Bilinmiyor'];
        sortedKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else if (groupOption !== 'none') {
        sortedKeys.sort(); 
    }

    return { groups: grouped, keys: sortedKeys, totalCount: result.length };
  }, [tabFilteredMovies, filterGenre, filterYear, filterMinRating, filterStatus, sortOption, groupOption, genres, activeTab, reviews]);

  // Vitrin Favorileri Mantığı
  const showcaseFavorites = useMemo(() => {
      if (!sharedList) return [null, null, null, null, null];
      const storedFavs = activeTab === 'movie' ? sharedList.topFavoriteMovies : sharedList.topFavoriteShows;
      if (storedFavs && storedFavs.some(id => id !== null)) return storedFavs;
      
      const sortedByRating = [...tabFilteredMovies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 5);
      const automaticIds = sortedByRating.map(m => m.id);
      while (automaticIds.length < 5) automaticIds.push(null as any);
      return automaticIds;
  }, [sharedList, tabFilteredMovies, activeTab]);

  // Liste yoksa
  if (!sharedList) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4 relative">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleTheme} className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm hover:scale-105 transition-transform">
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707M12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                </button>
            </div>
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Liste Bulunamadı</h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">Aradığınız liste silinmiş, gizlenmiş veya bağlantı hatalı olabilir.</p>
            <button onClick={onBack} className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity">Tria Anasayfasına Dön</button>
        </div>
    );
  }

  return (
    <div className="animate-slide-in-up pb-20 pt-4 max-w-6xl mx-auto relative">
      
      {/* THEME TOGGLE (FIXED) */}
      <div className="fixed top-6 right-6 z-[60]">
        <button onClick={toggleTheme} className="p-3 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-lg border border-white/20 dark:border-white/10 text-neutral-900 dark:text-white hover:scale-105 transition-transform">
            {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707M12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
        </button>
      </div>
      
      {/* HEADER */}
      <div className="text-center mb-10 px-4 pt-8 md:pt-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Paylaşılan Koleksiyon
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight leading-tight">{sharedList.name}</h1>
          <div className="flex flex-col items-center gap-1 mb-6">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Hazırlayan</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{sharedList.owner || 'Anonim'}</span>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300 max-w-lg mx-auto text-base md:text-lg leading-relaxed font-medium opacity-90">Bu koleksiyonda toplam <strong>{allMovies.length}</strong> yapım bulunmaktadır.</p>
      </div>

      {/* TAB NAVBAR */}
      <MediaTypeNavbar activeType={activeTab} onChange={(t) => setActiveTab(t)} />

      {tabFilteredMovies.length > 0 ? (
          <>
            {/* VİTRİN */}
            <div className="mb-12">
                <TopFavorites favorites={showcaseFavorites} collectionMovies={tabFilteredMovies} onSlotClick={() => {}} type={activeTab} readOnly={true} />
            </div>

            {/* ANALİZ */}
            <div className="mb-12">
                 <ErrorBoundary>
                    <CollectionAnalytics movies={tabFilteredMovies} genres={genres} />
                 </ErrorBoundary>
            </div>

            {/* FİLM GRİDİ + KONTROLLER (YENİLENEN KISIM) */}
            <div className="mb-8">
                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 px-1 flex items-center gap-2">
                    <span className={`w-1 h-6 rounded-full ${activeTab === 'movie' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                    {activeTab === 'movie' ? 'Film Arşivi' : 'Dizi Arşivi'}
                </h3>

                {/* COLLECTION CONTROLS (Sıralama, Filtreleme, Gruplama) */}
                <CollectionControls 
                    genres={genres}
                    currentSort={sortOption}
                    onSortChange={setSortOption}
                    filterGenre={filterGenre}
                    onFilterGenreChange={setFilterGenre}
                    filterYear={filterYear}
                    onFilterYearChange={setFilterYear}
                    filterMinRating={filterMinRating}
                    onFilterMinRatingChange={setFilterMinRating}
                    filterStatus={filterStatus}
                    onFilterStatusChange={setFilterStatus}
                    currentGroup={groupOption}
                    onGroupChange={setGroupOption}
                    resultCount={processedData.totalCount}
                />

                {/* GRUPLANMIŞ LİSTELEME */}
                {processedData.keys.length > 0 ? (
                    <div className="space-y-12">
                        {processedData.keys.map(groupKey => (
                            <div key={groupKey}>
                                {/* Grup Başlığı (Sadece Gruplama Aktifse) */}
                                {groupOption !== 'none' && (
                                    <div className="sticky top-20 z-20 bg-vista-light/95 dark:bg-vista-dark/95 backdrop-blur-sm py-3 mb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                                        <h4 className="text-xl font-bold text-neutral-800 dark:text-white truncate max-w-md">
                                            {groupKey}
                                        </h4>
                                        <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-2 py-1 rounded-full">
                                            {processedData.groups[groupKey].length}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 px-4">
                                    {processedData.groups[groupKey].map((movie, index) => (
                                        <MovieCard 
                                            key={`${movie.id}-${index}`}
                                            movie={movie} 
                                            onClick={onSelectMovie} 
                                            allGenres={genres}
                                            mediaType={activeTab}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <p className="mb-2">Seçilen kriterlere uygun içerik bulunamadı.</p>
                        <button 
                            onClick={() => { setFilterGenre(null); setFilterYear(null); setFilterMinRating(null); setFilterStatus('all'); }}
                            className="text-indigo-500 hover:underline font-bold text-sm"
                        >
                            Filtreleri Temizle
                        </button>
                    </div>
                )}
            </div>
          </>
      ) : (
          /* Boş Durum */
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 mx-4">
             <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
             </div>
             <p className="font-medium">Bu listede hiç {activeTab === 'movie' ? 'film' : 'dizi'} bulunmuyor.</p>
          </div>
      )}

      {/* ALT BİLGİ */}
      <div className="mt-24 pt-12 border-t border-neutral-200 dark:border-neutral-800 text-center">
           <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Beğendiniz mi?</h3>
           <p className="text-neutral-500 dark:text-neutral-400 mb-8">Siz de kendi film ve dizi koleksiyonunuzu oluşturun.</p>
           <div className="flex justify-center gap-4">
               <button onClick={onBack} className="px-8 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform shadow-xl">
                   {user ? 'Koleksiyonuma Dön' : 'Tria\'yı Keşfet'}
               </button>
           </div>
           <div className="mt-12 opacity-50"><span className="text-xs font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-600">Tria.</span></div>
      </div>
    </div>
  );
};

export default SharedListView;