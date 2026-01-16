import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TmdbService } from '../../services/tmdbService';
import { Movie, Genre, SortOption, MediaType } from '../../types';
import { useCollectionContext } from '../../context/CollectionContext';
import MovieCard from '../MovieCard';
import FilterBar from '../FilterBar';
import MediaTypeNavbar from '../MediaTypeNavbar';
import { MovieCardSkeleton } from '../skeletons/Skeletons';
import ErrorBoundary from '../ErrorBoundary';

interface ExploreViewProps {
  searchQuery: string;
  genres: Genre[];
  onSelectMovie: (movie: Movie) => void;
}

const ExploreView: React.FC<ExploreViewProps> = ({ 
  searchQuery, 
  genres, 
  onSelectMovie
}) => {
  const { toggleMovieInCollection, checkIsSelected } = useCollectionContext();
  
  // Local State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Filter State
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popularity.desc');

  // Infinite Scroll Ref
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return; 
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset on Filter Change
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setIsInitialLoad(true);
  }, [selectedGenre, selectedYear, sortBy, mediaType]);

  // Fetch Logic
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const tmdb = new TmdbService();
      let response;

      if (debouncedQuery) {
        response = await tmdb.searchMovies(debouncedQuery, page, mediaType, selectedYear || undefined);
        
        // Client-side Filter/Sort for Search results
        let results = response.results;
        if (selectedGenre) {
           results = results.filter(m => m.genre_ids?.includes(selectedGenre));
        }
        results.sort((a, b) => {
            if (sortBy === 'vote_average.desc') return b.vote_average - a.vote_average;
            if (sortBy === 'primary_release_date.desc') {
                const dateA = a.release_date || a.first_air_date || '';
                const dateB = b.release_date || b.first_air_date || '';
                return dateB.localeCompare(dateA);
            }
            if (sortBy === 'revenue.desc') return b.vote_average - a.vote_average; 
            return 0; 
        });
        response.results = results;

      } else {
        response = await tmdb.discoverMovies(
            page, 
            sortBy, 
            selectedGenre || undefined,
            selectedYear || undefined,
            mediaType
        );
      }

      setMovies(prev => {
        if (page === 1) return response.results;
        // Deduplicate
        const newMovies = response.results.filter(
          newM => !prev.some(prevM => prevM.id === newM.id)
        );
        return [...prev, ...newMovies];
      });

      setHasMore(response.page < response.total_pages);
    } catch (error) {
      console.error("Failed to fetch movies", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [page, debouncedQuery, selectedGenre, selectedYear, sortBy, mediaType]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);


  return (
    <div className="animate-slide-in-up">
      <MediaTypeNavbar 
        activeType={mediaType} 
        onChange={(type) => {
          setMediaType(type);
          setPage(1);
        }} 
      />

      <FilterBar 
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          currentSort={sortBy}
          onSortChange={setSortBy}
          disabled={loading && isInitialLoad}
      />

      {debouncedQuery && (
            <div className="mb-6 flex items-center justify-between">
                <div className="text-base text-neutral-500">
                    "<span className="text-neutral-900 dark:text-white font-bold">{debouncedQuery}</span>" için sonuçlar
                </div>
                {(selectedGenre || selectedYear) && (
                    <button 
                        onClick={() => {
                            setSelectedGenre(null);
                            setSelectedYear(null);
                        }}
                        className="text-xs font-bold text-indigo-500 hover:underline"
                    >
                        Filtreleri Temizle
                    </button>
                )}
            </div>
      )}

      <ErrorBoundary>
        {/* UPDATE: Increased grid columns for large screens (lg, xl, 2xl) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 min-h-[50vh]">
            {/* Render Movies */}
            {movies.map((movie, index) => {
            const isSelected = checkIsSelected(movie.id);
            const isLast = movies.length === index + 1;
            
            return (
                <div key={`${movie.id}-${index}`} ref={isLast ? lastMovieElementRef : null}>
                    <MovieCard 
                        movie={movie} 
                        isSelected={isSelected}
                        onToggleSelect={toggleMovieInCollection}
                        onClick={onSelectMovie} 
                        allGenres={genres}
                    />
                </div>
            );
            })}

            {/* Render Skeletons for Loading State */}
            {loading && (
                // If initial load, show full grid, else just show a few appended
                Array.from({ length: isInitialLoad ? 12 : 6 }).map((_, i) => (
                    <MovieCardSkeleton key={`skeleton-${i}`} />
                ))
            )}
        </div>
      </ErrorBoundary>

      {!loading && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-neutral-500 dark:text-neutral-400 text-center">
             <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                 Sonuç bulunamadı
             </h3>
             <p className="max-w-xs mx-auto text-sm opacity-60 mb-8">
                 {debouncedQuery ? 'Aradığınız terim veya filtrelerle eşleşen içerik yok.' : 'Aradığınız kriterlere uygun içerik bulamadık.'}
             </p>
          </div>
      )}
    </div>
  );
};

export default ExploreView;