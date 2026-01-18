import React, { useMemo, useState, useEffect } from 'react';
import { Movie, Genre } from '../../types';
import { useCollectionContext } from '../../context/CollectionContext';
import { useReviewContext } from '../../context/ReviewContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MovieCard from '../MovieCard';
import DashboardHeader from '../DashboardHeader';
import CollectionAnalytics from '../analytics/CollectionAnalytics'; 
import CollectionControls, { SortOptionType, GroupOptionType, FilterStatusType } from '../dashboard/CollectionControls';
import TopFavorites from '../dashboard/TopFavorites';
import FavoriteSelectorModal from '../dashboard/FavoriteSelectorModal';
import ErrorBoundary from '../ErrorBoundary';

interface DashboardViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
}

type TabOption = 'movie' | 'tv';

const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectMovie,
  genres
}) => {
  const { showToast } = useToast();
  const { user, openAuthModal } = useAuth();
  const { 
    collections, 
    activeCollectionId, 
    setActiveCollectionId, 
    createCollection, 
    toggleMovieInCollection, 
    checkIsSelected,
    updateTopFavorite,
    refreshCollectionData
  } = useCollectionContext();

  const { reviews } = useReviewContext();

  // --- EMPTY STATE UI COMPONENT ---
  if (collections.length === 0) {
      const [newListName, setNewListName] = useState('');
      const [isCreating, setIsCreating] = useState(false);

      const handleCreateFirst = (e: React.FormEvent) => {
          e.preventDefault();
          if (!user) {
              openAuthModal();
              return;
          }
          if (newListName.trim()) {
              createCollection(newListName.trim());
          }
      };

      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in p-4">
              <div className="max-w-3xl w-full bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative overflow-hidden">
                  
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                  <div className="relative z-10">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-8 transform rotate-3 hover:rotate-6 transition-transform">
                          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                      </div>

                      <h2 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                          Koleksiyonunu Başlat
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                          Henüz bir listen yok. Sinema zevkini yansıtan listeler oluşturarak arşivini düzenlemeye başla.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-3 font-bold">1</div>
                              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Düzenle</h4>
                              <p className="text-xs text-neutral-500">Favorilerini türlere, yıllara veya ruh haline göre kategorize et.</p>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-3 font-bold">2</div>
                              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Paylaş</h4>
                              <p className="text-xs text-neutral-500">Listelerini arkadaşlarınla paylaş ve sinema zevkini göster.</p>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center mb-3 font-bold">3</div>
                              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Keşfet</h4>
                              <p className="text-xs text-neutral-500">İstatistiklerle izleme alışkanlıklarını analiz et.</p>
                          </div>
                      </div>

                      {!isCreating ? (
                          <button 
                              onClick={() => setIsCreating(true)}
                              className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
                          >
                              İlk Listeni Oluştur
                          </button>
                      ) : (
                          <form onSubmit={handleCreateFirst} className="max-w-sm mx-auto animate-slide-in-up">
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      autoFocus
                                      value={newListName}
                                      onChange={(e) => setNewListName(e.target.value)}
                                      placeholder="Örn: Favorilerim"
                                      className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none font-bold"
                                  />
                                  <button 
                                      type="submit"
                                      disabled={!newListName.trim()}
                                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                      Oluştur
                                  </button>
                              </div>
                              <button 
                                  type="button" 
                                  onClick={() => setIsCreating(false)}
                                  className="mt-3 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline"
                              >
                                  İptal
                              </button>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- Auto-Repair Data Effect ---
  useEffect(() => {
      refreshCollectionData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCollectionId]);

  // --- View Control State ---
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

  const handleSlotSelect = (movieId: number) => {
      if (selectorSlotIndex !== null) {
          updateTopFavorite(selectorSlotIndex, movieId, activeTab); 
          setSelectorSlotIndex(null);
          showToast('Vitrin güncellendi', 'success');
      }
  };

  const handleSlotClear = () => {
      if (selectorSlotIndex !== null) {
          updateTopFavorite(selectorSlotIndex, null, activeTab); 
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
        />
        
        {/* Tab Bar */}
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
                    <span>Diziler</span>
                </button>
            </div>
        </div>

        {/* TOP FAVORITES SHOWCASE */}
        {activeCollectionMovies.length > 0 && (
            <TopFavorites 
                favorites={activeFavorites}
                collectionMovies={tabFilteredMovies} 
                onSlotClick={setSelectorSlotIndex}
                type={activeTab}
            />
        )}

        {/* SELECTOR MODAL */}
        {selectorSlotIndex !== null && (
            <FavoriteSelectorModal 
                collectionMovies={tabFilteredMovies} 
                slotIndex={selectorSlotIndex}
                onSelect={handleSlotSelect}
                onClear={handleSlotClear}
                onClose={() => setSelectorSlotIndex(null)}
            />
        )}

        {/* ANALİTİK */}
        {tabFilteredMovies.length > 0 && (
            <div className="mb-12">
                 <ErrorBoundary>
                    <CollectionAnalytics 
                        movies={tabFilteredMovies} 
                        genres={genres}
                    />
                 </ErrorBoundary>
            </div>
        )}

        {/* LIST CONTROLS & GRID */}
        <div className="mb-8">
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
                                        mediaType={activeTab} 
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
                </div>
            )}
        </div>

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