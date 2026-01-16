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
    <div className="min-h-screen bg-vista-light dark:bg-black animate-slide-in-right pb-20">
      
      {/* Hero Section */}
      <DetailHero 
        movie={movie} 
        onBack={onBack} 
        onToggleCollection={toggleMovieInCollection} 
        isInCollection={isInCollection} 
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            
            {/* Left Column: Poster */}
            <div className="hidden md:block flex-shrink-0 w-64 lg:w-80">
                <img 
                    src={posterUrl} 
                    alt={displayTitle} 
                    className="w-full rounded-2xl shadow-2xl border-4 border-white dark:border-neutral-800"
                />
            </div>

            {/* Right Column: Info & Stats */}
            <div className="flex-1 pt-4 md:pt-24">
                
                {/* Mobile Poster + Title Header */}
                <div className="flex gap-4 md:block mb-6">
                    <img 
                        src={posterUrl} 
                        className="w-24 h-36 rounded-lg shadow-lg md:hidden object-cover" 
                        alt="Poster"
                    />
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white leading-tight mb-2">
                            {displayTitle}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-medium">
                            {dateDisplay && <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">{dateDisplay}</span>}
                            
                            {/* TV Status Badge */}
                            {isTv && movie.status && (
                                <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${movie.status === 'Ended' || movie.status === 'Canceled' ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {getStatusLabel(movie.status)}
                                </span>
                            )}

                            {runtimeDisplay && (
                                <>
                                    <span className="hidden md:inline w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                    <span>{runtimeDisplay}</span>
                                </>
                            )}
                            
                            <span className="hidden md:inline w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                <span>{movie.vote_average.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {movie.genres?.map(g => (
                        <span key={g.id} className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                            {g.name}
                        </span>
                    ))}
                </div>

                {/* TV Specific Stats (Seasons/Episodes) */}
                {isTv && <TvStats seasons={movie.number_of_seasons} episodes={movie.number_of_episodes} />}

                {/* Tagline & Overview */}
                {movie.tagline && (
                    <p className="text-lg md:text-xl text-neutral-500 italic font-light mb-4">
                        "{movie.tagline}"
                    </p>
                )}
                
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-3">Özet</h3>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-base md:text-lg">
                        {movie.overview || "Bu içerik için özet bilgisi bulunmamaktadır."}
                    </p>
                </div>

                {/* Key People */}
                {keyPeople && (
                    <div className="mb-8">
                         <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-2">{keyPeopleLabel}</h3>
                         <p className="text-neutral-700 dark:text-neutral-300 font-medium">{keyPeople}</p>
                    </div>
                )}

                {/* Cast Section */}
                <CastList cast={movie.credits?.cast} />

                {/* User Review Section (NEW) */}
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mt-8">
                    <ReviewSection movieId={movie.id} movieTitle={displayTitle} />
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailView;