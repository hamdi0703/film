import React, { useEffect, useState } from 'react';
import { Movie, MediaType } from '../types';
import { useCollectionContext } from '../context/CollectionContext';
import { TmdbService, IMAGE_BASE_URL } from '../services/tmdbService';
import DetailHero from './details/DetailHero';
import CastList from './details/CastList';
import TvStats from './details/TvStats';
import ReviewSection from './details/ReviewSection';
import { DetailSkeleton } from './skeletons/Skeletons';

interface MovieDetailViewProps {
  movieId: number;
  type?: MediaType;
  onBack: () => void;
}

const MovieDetailView: React.FC<MovieDetailViewProps> = ({ 
  movieId, 
  type = 'movie', 
  onBack
}) => {
  const { toggleMovieInCollection, checkIsSelected } = useCollectionContext();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const service = new TmdbService();
        try {
            const data = await service.getMovieDetail(movieId, type as MediaType);
            setMovie(data);
        } catch (e) {
            const alternateType: MediaType = type === 'movie' ? 'tv' : 'movie';
            const data = await service.getMovieDetail(movieId, alternateType);
            setMovie(data);
        }
      } catch (error) {
        console.error("Failed to load movie details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo(0, 0);
  }, [movieId, type]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!movie) return null;

  const isTv = !!movie.first_air_date || !!movie.name;
  const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://placehold.co/780x1170?text=No+Image';
  const displayTitle = movie.title || movie.name || 'Bilinmiyor';

  // --- Data Normalization ---
  const creators = movie.created_by?.map(c => c.name).join(', ');
  const director = movie.credits?.crew.find(c => c.job === 'Director')?.name;
  const keyPeopleLabel = isTv ? 'Yaratıcılar' : 'Yönetmen';
  const keyPeople = isTv ? (creators || 'Belirtilmemiş') : director;

  const startYear = movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : (movie.release_date ? new Date(movie.release_date).getFullYear() : '');
  const endYear = movie.status === 'Ended' && movie.last_air_date ? new Date(movie.last_air_date).getFullYear() : '';
  const dateDisplay = isTv ? `${startYear}${endYear ? ` - ${endYear}` : ' - Günümüz'}` : startYear;

  const formatRuntime = (mins?: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}s ${m}d` : `${m}d`;
  };
  const runtimeDisplay = isTv 
    ? (movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} dk/bölüm` : '') 
    : formatRuntime(movie.runtime);

  const getStatusLabel = (status?: string) => {
      switch(status) {
          case 'Returning Series': return 'Devam Ediyor';
          case 'Ended': return 'Sona Erdi';
          case 'Canceled': return 'İptal Edildi';
          case 'In Production': return 'Yapım Aşamasında';
          default: return status;
      }
  };

  const isInCollection = checkIsSelected(movie.id);

  return (
    <div className="min-h-screen bg-vista-light dark:bg-black animate-slide-in-right pb-20 w-full overflow-x-hidden">
      
      {/* Hero Section */}
      <DetailHero 
        movie={movie} 
        onBack={onBack} 
        onToggleCollection={toggleMovieInCollection} 
        isInCollection={isInCollection} 
      />

      {/* 
         Main Container 
         - Increased padding: px-6 (mobile) and md:px-12 (desktop)
         - This effectively creates a 1.5x margin increase compared to previous px-4/px-8
      */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 -mt-16 md:-mt-32 relative z-10">
        
        {/* SECTION 1: HEADER INFO (Poster + Metadata) */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-16">
            
            {/* Poster - Desktop */}
            <div className="hidden md:block flex-shrink-0 w-64 lg:w-80 relative z-20">
                <div className="aspect-[2/3] rounded-2xl shadow-2xl border-4 border-white dark:border-neutral-900 overflow-hidden bg-neutral-800">
                    <img 
                        src={posterUrl} 
                        alt={displayTitle} 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Header Content */}
            <div className="flex-1 pt-2 md:pt-32">
                
                {/* Mobile Poster + Title Wrapper */}
                <div className="flex gap-4 md:block mb-6 items-end md:items-start">
                    {/* Mobile Poster */}
                    <div className="w-28 h-40 flex-shrink-0 rounded-lg shadow-xl md:hidden overflow-hidden border-2 border-white dark:border-neutral-800 relative z-20 bg-neutral-800">
                        <img 
                            src={posterUrl} 
                            className="w-full h-full object-cover" 
                            alt="Poster"
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-xl md:text-5xl font-bold text-neutral-900 dark:text-white leading-snug mb-2 line-clamp-3 drop-shadow-md md:drop-shadow-none">
                            {displayTitle}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-base text-neutral-600 dark:text-neutral-400 font-medium">
                            {dateDisplay && <span className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{dateDisplay}</span>}
                            
                            {isTv && movie.status && (
                                <span className={`px-1.5 py-0.5 rounded text-white font-bold ${movie.status === 'Ended' || movie.status === 'Canceled' ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {getStatusLabel(movie.status)}
                                </span>
                            )}

                            {runtimeDisplay && (
                                <>
                                    <span className="hidden md:inline w-1 h-1 bg-neutral-400 rounded-full"></span>
                                    <span>{runtimeDisplay}</span>
                                </>
                            )}
                            
                            <span className="hidden md:inline w-1 h-1 bg-neutral-400 rounded-full"></span>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                <span>{movie.vote_average.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres?.map(g => (
                        <span key={g.id} className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-default">
                            {g.name}
                        </span>
                    ))}
                </div>

                {/* TV Specific Stats */}
                {isTv && <TvStats seasons={movie.number_of_seasons} episodes={movie.number_of_episodes} />}

                {/* Tagline */}
                {movie.tagline && (
                    <p className="text-base md:text-xl text-neutral-500 italic font-light">
                        "{movie.tagline}"
                    </p>
                )}
            </div>
        </div>

        {/* SECTION 2: CONTENT & CAST */}
        <div className="flex flex-col gap-16">
            
            {/* Overview & Key People - CENTERED ALIGNMENT */}
            <div className="w-full">
                <div className="max-w-4xl space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2 inline-block">Özet</h3>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-loose text-base md:text-lg font-light">
                            {movie.overview || "Bu içerik için özet bilgisi bulunmamaktadır."}
                        </p>
                    </div>

                    {keyPeople && (
                        <div>
                             <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-2">{keyPeopleLabel}</h3>
                             <p className="text-neutral-700 dark:text-neutral-300 font-medium text-base">{keyPeople}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cast List - Full Width */}
            <div className="w-full">
                <CastList cast={movie.credits?.cast} />
            </div>
        </div>

        {/* SECTION 3: REVIEWS (Centered & Balanced) */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 mt-16">
            <div className="max-w-4xl mx-auto">
                 <ReviewSection movieId={movie.id} movieTitle={displayTitle} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default MovieDetailView;