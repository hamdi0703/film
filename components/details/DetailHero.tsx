import React from 'react';
import { Movie } from '../../types';
import { BACKDROP_BASE_URL } from '../../services/tmdbService';

interface DetailHeroProps {
  movie: Movie;
  onBack: () => void;
  onToggleCollection: (movie: Movie) => void;
  isInCollection: boolean;
}

const DetailHero: React.FC<DetailHeroProps> = ({ movie, onBack, onToggleCollection, isInCollection }) => {
  const backdropUrl = movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : null;

  return (
    // CHANGE: h-[50vh] -> h-[40vh] on mobile to fix zoomed-in feeling
    <div className="relative h-[40vh] md:h-[65vh] w-full overflow-hidden z-0">
        {backdropUrl ? (
             <>
                <img 
                    src={backdropUrl} 
                    alt={movie.title || movie.name} 
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay for text legibility and smooth transitions */}
                <div className="absolute inset-0 bg-gradient-to-t from-vista-light dark:from-black via-transparent to-black/40"></div>
             </>
        ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <span className="text-neutral-600 font-bold">Görsel Yok</span>
            </div>
        )}

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-50">
            <button 
                onClick={onBack}
                aria-label="Geri Dön"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/10"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            
            <button 
                onClick={() => onToggleCollection(movie)}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full backdrop-blur-md font-bold text-xs md:text-sm transition-all flex items-center gap-2 border ${
                    isInCollection 
                    ? 'bg-red-500/90 border-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600' 
                    : 'bg-black/30 border-white/20 text-white hover:bg-white hover:text-black hover:border-white'
                }`}
            >
                {isInCollection ? (
                    <>
                        <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        <span className="hidden sm:inline">Listeden Çıkar</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span className="hidden sm:inline">Listeye Ekle</span>
                    </>
                )}
            </button>
        </div>
      </div>
  );
};

export default DetailHero;