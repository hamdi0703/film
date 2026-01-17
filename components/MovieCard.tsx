import React, { useState, useMemo } from 'react';
import { Movie, Genre } from '../types';
import { IMAGE_BASE_URL } from '../services/tmdbService';
import { useReviews } from '../hooks/useReviews';

interface MovieCardProps {
  movie: Movie;
  isSelected?: boolean;
  onToggleSelect?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
  allGenres?: Genre[];
  mediaType?: 'movie' | 'tv'; 
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  isSelected = false, 
  onToggleSelect, 
  onClick, 
  allGenres,
  mediaType 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { review } = useReviews(movie.id);

  // Determine effective type (prop override or auto-detect)
  const isTv = mediaType === 'tv' || !!(movie.name || movie.first_air_date);
  
  const title = movie.title || movie.name || 'Untitled';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  
  const imageUrl = movie.poster_path 
    ? `${IMAGE_BASE_URL}${movie.poster_path}` 
    : `https://placehold.co/780x1170/000000/FFFFFF?text=${encodeURIComponent(title)}`;

  // --- META DATA LOGIC ---
  const dateString = movie.release_date || movie.first_air_date;
  const year = useMemo(() => {
    return dateString ? new Date(dateString).getFullYear() : null;
  }, [dateString]);

  // MOVIE: Runtime formatting
  const runtimeText = useMemo(() => {
      if (isTv) return null;
      if (!movie.runtime) return null;
      const h = Math.floor(movie.runtime / 60);
      const m = movie.runtime % 60;
      return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  }, [movie.runtime, isTv]);

  // TV: Season/Status formatting
  const tvMetaText = useMemo(() => {
      if (!isTv) return null;
      
      const seasons = movie.number_of_seasons;
      if (!seasons) return year ? `${year}` : null;

      return `${seasons} Sezon`;
  }, [isTv, movie.number_of_seasons, year]);

  const tvStatusText = useMemo(() => {
      if (!isTv || !movie.status) return null;
      if (movie.status === 'Ended') return 'Sona Erdi';
      if (movie.status === 'Returning Series') return 'Devam Ediyor';
      return null;
  }, [isTv, movie.status]);

  const hasComment = review?.comment && review.comment.trim().length > 0;

  return (
    <div className="group relative w-full aspect-[2/3] perspective-1000 animate-fade-in">
      
      {/* AMBIENT GLOW - Performance optimization: Only show on hover/load to reduce paint costs */}
      <div 
        className={`absolute inset-0 bg-cover bg-center blur-xl opacity-0 transition-opacity duration-500 rounded-3xl ${isLoaded ? 'group-hover:opacity-40 dark:group-hover:opacity-30' : ''}`}
        style={{ backgroundImage: `url(${imageUrl})`, transform: 'scale(0.95) translateY(10px)' }}
      ></div>

      {/* MAIN CARD */}
      <div 
        onClick={() => onClick && onClick(movie)}
        className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-md cursor-pointer transform transition-transform duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1"
      >
        {!isLoaded && (
            <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        )}

        <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async" 
            className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            onLoad={() => setIsLoaded(true)}
        />

        {/* --- INDICATORS --- */}
        {review && (
            <div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-2 items-start animate-fade-in">
                {review.rating > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                        <svg className="w-3 h-3 text-blue-400 fill-current" viewBox="0 0 24 24">
                             <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs font-bold text-white leading-none pt-0.5">{review.rating}</span>
                    </div>
                )}
                {hasComment && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-neutral-900 shadow-xl border border-neutral-200" title="İnceleme Yazıldı">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                )}
            </div>
        )}

        {/* Selection Heart */}
        {onToggleSelect && (
            <button 
            onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(movie);
            }}
            aria-label={isSelected ? `${title} favorilerden çıkar` : `${title} favorilere ekle`}
            className={`absolute top-2.5 right-2.5 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm border border-transparent ${
                isSelected 
                ? 'bg-white text-red-500 scale-100 opacity-100 shadow-red-500/20' 
                : 'bg-black/40 border-white/10 text-white hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0'
            }`}
            >
            {isSelected ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )}
            </button>
        )}

        {/* Text Overlay */}
        <div className={`absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 transition-opacity duration-500 ${isLoaded ? 'opacity-90' : 'opacity-0'}`} />

        <div className={`absolute bottom-0 left-0 right-0 p-4 text-white z-10 flex flex-col justify-end transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-lg font-bold leading-tight line-clamp-2 drop-shadow-md mb-1">
            {title}
            </h3>
            
            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-300 mb-1.5 opacity-90">
                {!isTv && (
                    <>
                        {year && <span>{year}</span>}
                        {year && runtimeText && <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>}
                        {runtimeText && <span>{runtimeText}</span>}
                    </>
                )}

                {isTv && (
                    <>
                        {tvMetaText && <span className="bg-white/20 px-1.5 py-0.5 rounded text-white">{tvMetaText}</span>}
                        {tvStatusText && (
                            <>
                                <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                                <span className={tvStatusText === 'Sona Erdi' ? 'text-red-300' : 'text-green-300'}>{tvStatusText}</span>
                            </>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center gap-3 opacity-90">
                <div className="flex items-center gap-1" title="TMDB Puanı">
                    <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="text-xs font-bold text-yellow-400">{rating}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders in grid lists
// Custom comparison function is usually not needed unless props are complex objects
// Default shallow compare handles primitive props (id, title) and function references (if stable) well.
export default React.memo(MovieCard);