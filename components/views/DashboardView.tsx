import React, { useMemo, useState } from 'react';
import { Movie, Genre } from '../../types';
import { useCollectionContext } from '../../context/CollectionContext';
import { useReviewContext } from '../../context/ReviewContext';
import MovieCard from '../MovieCard';
import DashboardHeader from '../DashboardHeader';
import StatsOverview from '../StatsOverview';
import GenreChart from '../GenreChart';
import ErasChart from '../analytics/ErasChart';
import ActorSpotlight from '../analytics/ActorSpotlight';
import DirectorSpotlight from '../analytics/DirectorSpotlight';
import CountrySpotlight from '../analytics/CountrySpotlight';
import CollectionControls, { SortOptionType, GroupOptionType, FilterStatusType } from '../dashboard/CollectionControls';
import TopFavorites from '../dashboard/TopFavorites';
import FavoriteSelectorModal from '../dashboard/FavoriteSelectorModal';
import { useToast } from '../../context/ToastContext';
import ErrorBoundary from '../ErrorBoundary';

interface DashboardViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
}

// REMOVED 'all', strictly binary choice now
type TabOption = 'movie' | 'tv';

const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectMovie,
  genres
}) => {
  const { showToast } = useToast();
  const { 
    collections, 
    activeCollectionId, 
    setActiveCollectionId, 
    createCollection, 
    deleteCollection, 
    toggleMovieInCollection, 
    checkIsSelected,
    updateTopFavorite,
    shareCollection
  } = useCollectionContext();

  const { reviews } = useReviewContext();
  
  // --- View Control State ---
  // Default is 'movie' to ensure a focused initial state
  const [activeTab, setActiveTab] = useState<TabOption>('movie');
  
  const [sortOption, setSortOption] = useState<SortOptionType>('added_desc');
  const [groupOption, setGroupOption] = useState<GroupOptionType>('none');
  
  // Filter States
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('all');

  // Top Favorites Selector State
  const [selectorSlotIndex, setSelectorSlotIndex] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 1. Raw Data from Context
  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeCollectionMovies = useMemo(() => activeCollection?.movies || [], [activeCollection]);
  
  // Select specific favorites array based on Active Tab
  const activeFavorites = useMemo(() => {
      if (!activeCollection) return [null, null, null, null, null];
      return activeTab === 'movie' 
        ? (activeCollection.topFavoriteMovies || [null, null, null, null, null])
        : (activeCollection.topFavoriteShows || [null, null, null, null, null]);
  }, [activeCollection, activeTab]);

  // 2. Tab Filtering (Strict Binary Filter)
  const tabFilteredMovies = useMemo(() => {
      return activeCollectionMovies.filter(m => {
          // Identify if item is TV based on properties
          const isTv = !!(m.name || m.first_air_date);
          // Strict comparison
          return activeTab === 'tv' ? isTv : !isTv;
      });
  }, [activeCollectionMovies, activeTab]);

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

  // --- DATA PIPELINE ---
  const processedData = useMemo(() => {
    let result = [...tabFilteredMovies];

    // 1. ADVANCED FILTERING
    
    // Status Filter (Rated / Reviewed)
    if (filterStatus === 'rated') {
        result = result.filter(m => {
            const r = reviews[m.id];
            return r && r.rating > 0;
        });
    } else if (filterStatus === 'reviewed') {
        result = result.filter(m => {
            const r = reviews[m.id];
            return r && r.comment && r.comment.trim().length > 0;
        });
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
        // Use meaningful label based on active tab
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


  const handleShareList = async () => {
    if (activeCollectionMovies.length === 0) return;
    if (isSharing) return;

    setIsSharing(true);
    showToast('Bağlantı oluşturuluyor...', 'info');

    try {
        const queryParam = await shareCollection(activeCollectionId);
        
        if (queryParam) {
            // FIX: Robust URL generation for Cloud/Preview environments
            let baseUrl = window.location.href;
            
            // 1. Remove 'blob:' prefix if it exists (common in IDX/Cloud previews)
            if (baseUrl.startsWith('blob:')) {
                baseUrl = baseUrl.replace('blob:', '');
            }

            // 2. Create clean URL object
            const cleanUrl = new URL(baseUrl);
            
            // 3. Clear existing hash/search to prevent duplication
            cleanUrl.hash = '';
            cleanUrl.search = ''; 

            // 4. Append the new query param (?list=... or ?ids=...)
            // Since queryParam already contains '?', we append it carefully or use searchParams
            const params = new URLSearchParams(queryParam);
            params.forEach((value, key) => {
                cleanUrl.searchParams.set(key, value);
            });

            const finalLink = cleanUrl.toString();

            navigator.clipboard.writeText(finalLink);
            showToast('Liste bağlantısı kopyalandı!', 'success');
        } else {
             showToast('Paylaşım sırasında bir hata oluştu.', 'error');
        }
    } catch (e) {
        showToast('Beklenmedik bir hata oluştu.', 'error');
        console.error(e);
    } finally {
        setIsSharing(false);
    }
  };

  const handleGenreClick = (id: number) => {
      setFilterGenre(id === filterGenre ? null : id);
  };

  const handleSlotSelect = (movieId: number) => {
      if (selectorSlotIndex !== null) {
          updateTopFavorite(selectorSlotIndex, movieId, activeTab); // Pass activeTab type
          setSelectorSlotIndex(null);
          showToast('Vitrin güncellendi', 'success');
      }
  };

  const handleSlotClear = () => {
      if (selectorSlotIndex !== null) {
          updateTopFavorite(selectorSlotIndex, null, activeTab); // Pass activeTab type
          setSelectorSlotIndex(null);
          showToast('Slot temizlendi', 'info');
      }
  };

  return (
    <div className="animate-slide-in-up">
        <DashboardHeader 
            collections={collections}
            activeCollectionId={activeCollectionId}
            onSwitchCollection={setActiveCollectionId}
            onCreateCollection={createCollection}
            onDeleteCollection={deleteCollection}
            onShare={handleShareList}
        />
        
        {/* NEW: Binary Tab Bar (Movie vs TV) - MOVED UP for visual hierarchy */}
        <div className="flex justify-center mb-6 animate-fade-in">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl inline-flex items-center shadow-inner relative">
                <button
                    onClick={() => setActiveTab('movie')}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        activeTab === 'movie'
                        ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm scale-100'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 scale-95 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'
                    }`}
                >
                     <svg className={`w-4 h-4 ${activeTab === 'movie' ? 'text-indigo-500' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <span>Filmler</span>
                </button>
                <button
                    onClick={() => setActiveTab('tv')}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        activeTab === 'tv'
                        ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm scale-100'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 scale-95 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'
                    }`}
                >
                     <svg className={`w-4 h-4 ${activeTab === 'tv' ? 'text-indigo-500' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Diziler</span>
                </button>
            </div>
        </div>

        {/* TOP FAVORITES SHOWCASE (Context Aware) */}
        {activeCollectionMovies.length > 0 && (
            <TopFavorites 
                favorites={activeFavorites}
                collectionMovies={tabFilteredMovies} // Only allow picking from current tab type
                onSlotClick={setSelectorSlotIndex}
                type={activeTab}
            />
        )}

        {/* SELECTOR MODAL */}
        {selectorSlotIndex !== null && (
            <FavoriteSelectorModal 
                collectionMovies={tabFilteredMovies} // Only show relevant movies/shows in modal
                slotIndex={selectorSlotIndex}
                onSelect={handleSlotSelect}
                onClear={handleSlotClear}
                onClose={() => setSelectorSlotIndex(null)}
            />
        )}

        {/* ANALYTICS SECTION */}
        {tabFilteredMovies.length > 0 && (
            <div className="mb-12 space-y-6">
                <ErrorBoundary>
                    <StatsOverview movies={tabFilteredMovies} />
                </ErrorBoundary>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                     <ErrorBoundary fullHeight>
                        <GenreChart 
                            movies={tabFilteredMovies} 
                            genres={genres} 
                            onGenreClick={handleGenreClick}
                        />
                     </ErrorBoundary>
                     <ErrorBoundary fullHeight>
                        <ErasChart movies={tabFilteredMovies} />
                     </ErrorBoundary>
                     <ErrorBoundary fullHeight>
                        <ActorSpotlight movies={tabFilteredMovies} />
                     </ErrorBoundary>
                     <ErrorBoundary fullHeight>
                        <DirectorSpotlight movies={tabFilteredMovies} />
                     </ErrorBoundary>
                     <ErrorBoundary fullHeight>
                        <CountrySpotlight movies={tabFilteredMovies} />
                     </ErrorBoundary>
                </div>
            </div>
        )}

        {/* LIST CONTROLS & GRID */}
        <div className="mb-8">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 px-1 flex items-center gap-2">
                <span className={`w-1 h-6 rounded-full ${activeTab === 'movie' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                {activeTab === 'movie' ? 'Film Arşivi' : 'Dizi Arşivi'}
            </h3>
            
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
            
            {/* RENDER GROUPS */}
            {processedData.keys.length > 0 ? (
                <div className="space-y-12">
                    {processedData.keys.map(groupKey => (
                        <div key={groupKey}>
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

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                                {processedData.groups[groupKey].map((movie, index) => (
                                    <MovieCard 
                                        key={`${movie.id}-${index}`}
                                        movie={movie} 
                                        isSelected={checkIsSelected(movie.id)}
                                        onToggleSelect={toggleMovieInCollection}
                                        onClick={onSelectMovie} 
                                        allGenres={genres}
                                        mediaType={activeTab} // PASSING THE TYPE EXPLICITLY
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <p className="mb-2">
                        {tabFilteredMovies.length === 0 
                            ? `Bu listede henüz ${activeTab === 'movie' ? 'film' : 'dizi'} yok.` 
                            : "Seçilen kriterlere uygun içerik bulunamadı."}
                    </p>
                    {tabFilteredMovies.length > 0 && (
                        <button 
                            onClick={() => { 
                                setFilterGenre(null); 
                                setFilterYear(null);
                                setFilterMinRating(null);
                                setFilterStatus('all');
                            }}
                            className="text-indigo-500 hover:underline font-bold text-sm"
                        >
                            Tüm Filtreleri Temizle
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Global Empty State */}
        {activeCollectionMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 text-neutral-500 dark:text-neutral-400 text-center">
             <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                 Koleksiyon boş
             </h3>
             <p className="max-w-xs mx-auto text-sm opacity-60 mb-8">
                 Listeniz henüz boş. Keşfet sayfasından içerik eklemeye başlayın.
             </p>
          </div>
        )}
    </div>
  );
};

export default DashboardView;