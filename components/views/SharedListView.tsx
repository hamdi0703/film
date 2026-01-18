import React, { useMemo, useState } from 'react';
import { useCollectionContext } from '../../context/CollectionContext';
import { Movie, Genre, MediaType } from '../../types';
import MovieCard from '../MovieCard';
import { useAuth } from '../../context/AuthContext';
import MediaTypeNavbar from '../MediaTypeNavbar';
import StatsOverview from '../StatsOverview';
import GenreChart from '../GenreChart';
import ErasChart from '../analytics/ErasChart';
import ActorSpotlight from '../analytics/ActorSpotlight';
import DirectorSpotlight from '../analytics/DirectorSpotlight';
import CountrySpotlight from '../analytics/CountrySpotlight';
import TopFavorites from '../dashboard/TopFavorites';
import ErrorBoundary from '../ErrorBoundary';

interface SharedListViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
  onBack: () => void;
}

type TabOption = 'movie' | 'tv';

const SharedListView: React.FC<SharedListViewProps> = ({ onSelectMovie, genres, onBack }) => {
  const { sharedList } = useCollectionContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabOption>('movie');

  const allMovies = useMemo(() => sharedList?.movies || [], [sharedList]);

  // Filter movies based on Active Tab
  const filteredMovies = useMemo(() => {
      return allMovies.filter(m => {
          const isTv = !!(m.name || m.first_air_date);
          return activeTab === 'tv' ? isTv : !isTv;
      });
  }, [allMovies, activeTab]);

  // Determine Favorites for Showcase
  // Logic: Use stored favorites if available, otherwise fallback to top 5 highest rated in the list
  const showcaseFavorites = useMemo(() => {
      if (!sharedList) return [null, null, null, null, null];
      
      const storedFavs = activeTab === 'movie' ? sharedList.topFavoriteMovies : sharedList.topFavoriteShows;
      
      // If we have explicit favorites, use them
      if (storedFavs && storedFavs.some(id => id !== null)) {
          return storedFavs;
      }
      
      // Automatic Fallback: Top 5 Highest Rated
      const sortedByRating = [...filteredMovies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 5);
      const automaticIds = sortedByRating.map(m => m.id);
      
      // Pad with nulls if less than 5
      while (automaticIds.length < 5) {
          automaticIds.push(null as any);
      }
      return automaticIds;
  }, [sharedList, filteredMovies, activeTab]);

  // Handle Missing List
  if (!sharedList) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Liste Bulunamadı</h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
                Aradığınız liste silinmiş, gizlenmiş veya bağlantı hatalı olabilir.
            </p>
            <button 
                onClick={onBack} 
                className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
                Tria Anasayfasına Dön
            </button>
        </div>
    );
  }

  return (
    <div className="animate-slide-in-up pb-20 pt-4 max-w-6xl mx-auto">
      
      {/* 1. HEADER */}
      <div className="text-center mb-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Paylaşılan Koleksiyon
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight leading-tight">
              {sharedList.name}
          </h1>
          
          <div className="flex flex-col items-center gap-1 mb-6">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Hazırlayan</span>
              <span className="text-lg font-bold text-indigo-500 dark:text-indigo-400">
                  {sharedList.owner || 'Anonim'}
              </span>
          </div>
          
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto text-base md:text-lg leading-relaxed">
             Bu koleksiyonda toplam <strong>{allMovies.length}</strong> yapım bulunmaktadır.
          </p>
      </div>

      {/* 2. MEDIA TYPE TABS */}
      <MediaTypeNavbar 
         activeType={activeTab} 
         onChange={(t) => setActiveTab(t)} 
      />

      {filteredMovies.length > 0 ? (
          <>
            {/* 3. SHOWCASE (VITRIN) - READ ONLY */}
            <div className="mb-12">
                <TopFavorites 
                    favorites={showcaseFavorites}
                    collectionMovies={filteredMovies}
                    onSlotClick={() => {}} // Read Only: No Action
                    type={activeTab}
                    readOnly={true} // Disable hover effects
                />
            </div>

            {/* 4. ANALYTICS GRID (FULL SET) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 items-start">
                <ErrorBoundary fullHeight>
                    <StatsOverview movies={filteredMovies} />
                </ErrorBoundary>
                <ErrorBoundary fullHeight>
                     <GenreChart 
                         movies={filteredMovies} 
                         genres={genres} 
                         onGenreClick={() => {}} // No filtering in shared view
                     />
                </ErrorBoundary>
                <ErrorBoundary fullHeight>
                     <ErasChart movies={filteredMovies} />
                </ErrorBoundary>
                <ErrorBoundary fullHeight>
                     <ActorSpotlight movies={filteredMovies} />
                </ErrorBoundary>
                <ErrorBoundary fullHeight>
                     <DirectorSpotlight movies={filteredMovies} />
                </ErrorBoundary>
                <ErrorBoundary fullHeight>
                     <CountrySpotlight movies={filteredMovies} />
                </ErrorBoundary>
            </div>

            {/* 5. CONTENT GRID */}
            <div className="mb-8">
                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 px-1 flex items-center gap-2">
                    <span className={`w-1 h-6 rounded-full ${activeTab === 'movie' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                    Tüm {activeTab === 'movie' ? 'Filmler' : 'Diziler'}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 px-4">
                    {filteredMovies.map((movie) => (
                        <MovieCard 
                            key={movie.id}
                            movie={movie} 
                            onClick={onSelectMovie} 
                            allGenres={genres}
                            mediaType={activeTab}
                        />
                    ))}
                </div>
            </div>
          </>
      ) : (
          /* Empty State for Tab */
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 mx-4">
             <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
             </div>
             <p className="font-medium">Bu listede hiç {activeTab === 'movie' ? 'film' : 'dizi'} bulunmuyor.</p>
          </div>
      )}

      {/* 6. FOOTER CTA */}
      <div className="mt-24 pt-12 border-t border-neutral-200 dark:border-neutral-800 text-center">
           <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Beğendiniz mi?</h3>
           <p className="text-neutral-500 mb-8">Siz de kendi film ve dizi koleksiyonunuzu oluşturun.</p>
           
           <div className="flex justify-center gap-4">
               <button 
                    onClick={onBack}
                    className="px-8 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform shadow-xl"
               >
                   {user ? 'Koleksiyonuma Dön' : 'Tria\'yı Keşfet'}
               </button>
           </div>
           
           <div className="mt-12 opacity-50">
                <span className="text-xs font-bold tracking-widest uppercase">Tria.</span>
           </div>
      </div>
    </div>
  );
};

export default SharedListView;