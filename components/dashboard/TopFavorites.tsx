import React from 'react';
import { Movie, MediaType } from '../../types';
import { IMAGE_BASE_URL } from '../../services/tmdbService';
import { useReviewContext } from '../../context/ReviewContext';

interface TopFavoritesProps {
  favorites: (number | null)[]; // Array of 5 IDs
  collectionMovies: Movie[];
  onSlotClick: (index: number) => void;
  type: MediaType;
  readOnly?: boolean; 
}

const TopFavorites: React.FC<TopFavoritesProps> = ({ 
    favorites, 
    collectionMovies, 
    onSlotClick, 
    type,
    readOnly = false 
}) => {
  const { reviews } = useReviewContext();
  
  const getMovie = (id: number | null) => {
    if (!id) return null;
    return collectionMovies.find(m => m.id === id) || null;
  };

  const getYear = (movie: Movie) => {
      const date = movie.release_date || movie.first_air_date;
      return date ? new Date(date).getFullYear() : '';
  };

  const renderCard = (index: number, rank: number, sizeClass: string, containerWidthClass: string) => {
    const movieId = favorites[index];
    const movie = getMovie(movieId);
    const imageUrl = movie?.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
    const isEmpty = !movie;

    // User Data
    const userReview = movieId ? reviews[movieId] : null;
    
    // Spoiler Logic
    let userComment = userReview?.comment;
    const isSpoiler = userReview?.hasSpoiler;
    
    // Eğer spoiler varsa metni değiştir
    if (isSpoiler && userComment) {
        userComment = "⚠️ Spoiler içeriyor.";
    }

    // Rank Styling
    let rankColor = "bg-neutral-800 text-white";
    let glowColor = "";
    
    if (rank === 1) {
        rankColor = "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-amber-500/50";
        glowColor = "group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]";
    } else if (rank === 2) {
        rankColor = "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-500/50";
        glowColor = "group-hover:shadow-[0_0_30px_-5px_rgba(148,163,184,0.5)]";
    } else if (rank === 3) {
        rankColor = "bg-gradient-to-br from-orange-300 to-orange-700 text-white shadow-orange-500/50";
        glowColor = "group-hover:shadow-[0_0_30px_-5px_rgba(234,88,12,0.5)]";
    }

    // ReadOnly Adjustment
    const cursorClass = readOnly ? 'cursor-default' : 'cursor-pointer';
    const hoverTransform = readOnly ? '' : 'hover:-translate-y-2';
    const groupHoverScale = readOnly ? '' : 'group-hover:scale-110';
    const groupOpacity = readOnly ? 'opacity-0' : 'group-hover:opacity-100';

    return (
      <div 
        key={`fav-${type}-${index}`}
        className={`flex flex-col items-center group ${containerWidthClass}`}
      >
          {/* POSTER CARD */}
          <div 
            onClick={() => !readOnly && onSlotClick(index)}
            className={`relative ${cursorClass} transition-all duration-500 ease-out transform ${hoverTransform} ${sizeClass}`}
          >
            {/* Card Frame */}
            <div className={`w-full h-full rounded-2xl overflow-hidden relative border transition-all duration-300 ${
                isEmpty 
                ? 'bg-white/5 border-2 border-dashed border-neutral-300 dark:border-neutral-700' 
                : `bg-neutral-900 border-transparent shadow-xl ${!readOnly ? glowColor : ''}`
            }`}>
                {/* Image */}
                {movie && imageUrl ? (
                    <>
                        <img 
                            src={imageUrl} 
                            alt={movie.title} 
                            className={`w-full h-full object-cover transition-transform duration-700 ${groupHoverScale}`}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${groupOpacity}`} />
                        
                        {/* Remove Icon (Only if NOT ReadOnly) */}
                        {!readOnly && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white/70 hover:bg-red-500 hover:text-white">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`flex flex-col items-center justify-center h-full text-neutral-400 transition-colors ${!readOnly ? 'group-hover:text-indigo-500' : ''}`}>
                        <svg className={`w-8 h-8 mb-2 opacity-50 transition-all ${!readOnly ? 'group-hover:opacity-100 group-hover:scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                        </svg>
                        {!readOnly && <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Seç</span>}
                    </div>
                )}
            </div>

            {/* Rank Badge */}
            <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full text-sm font-black shadow-lg border-2 border-white dark:border-neutral-900 ${rankColor}`}>
                {rank}
            </div>
          </div>

          {/* META INFO */}
          {movie && (
              <div className="mt-5 text-center w-full px-1 animate-fade-in flex flex-col items-center">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight mb-1 truncate w-full">
                      {movie.title || movie.name}
                  </h3>
                  <div className="text-[10px] text-neutral-500 font-medium mb-2">
                      {getYear(movie)}
                  </div>

                  <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                          <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">{movie.vote_average.toFixed(1)}</span>
                      </div>
                  </div>

                  {/* USER REVIEW SNIPPET (YENİ EKLENEN KISIM) */}
                  {userComment && (
                    <div className="w-full mt-1 px-3 py-2 bg-white/60 dark:bg-white/5 rounded-xl border border-neutral-100 dark:border-white/5 relative group/comment transition-colors hover:bg-white dark:hover:bg-neutral-800">
                        <div className="absolute top-2 left-2 text-indigo-500/20 dark:text-indigo-400/20">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>
                        </div>
                        <p className={`text-[10px] text-neutral-600 dark:text-neutral-400 italic font-medium leading-relaxed line-clamp-2 relative z-10 pl-1 ${isSpoiler ? 'text-red-500 dark:text-red-400 not-italic' : ''}`}>
                            "{userComment}"
                        </p>
                    </div>
                  )}
              </div>
          )}
      </div>
    );
  };

  const renderBonusSlot = (index: number) => {
    const movieId = favorites[index];
    const movie = getMovie(movieId);
    const imageUrl = movie?.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
    
    return (
        <div className="flex flex-col items-center">
            <div 
                key={`bonus-${index}`}
                onClick={() => !readOnly && onSlotClick(index)}
                className={`relative w-20 h-28 md:w-24 md:h-36 rounded-xl overflow-hidden group border border-neutral-200 dark:border-neutral-800 transition-all ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-indigo-500'}`}
            >
                {movie && imageUrl ? (
                    <>
                        <img src={imageUrl} alt="Bonus" className={`w-full h-full object-cover transition-opacity ${readOnly ? '' : 'opacity-80 group-hover:opacity-100'}`} />
                        {!readOnly && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`w-full h-full bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center text-neutral-400 ${!readOnly ? 'hover:text-indigo-500' : ''}`}>
                        <span className="text-[9px] font-bold mb-1">BONUS</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                )}
            </div>
            
            {movie && (
                <div className="mt-2 text-center w-24">
                     <div className="text-[10px] font-bold truncate text-neutral-700 dark:text-neutral-300">{movie.title || movie.name}</div>
                     <div className="flex justify-center gap-2 mt-0.5 text-[9px] text-neutral-500">
                         <span>★ {movie.vote_average.toFixed(1)}</span>
                     </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="mb-12 animate-fade-in">
        <div className="flex items-end gap-3 mb-6 px-1">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 tracking-tight">
                <span className={`w-1.5 h-6 rounded-full ${type === 'movie' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                {type === 'movie' ? 'Film Vitrini' : 'Dizi Vitrini'}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent mb-2"></div>
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-4 md:p-8 rounded-[2rem] border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden backdrop-blur-sm">
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-gradient-to-b ${type === 'movie' ? 'from-indigo-500/10' : 'from-purple-500/10'} to-transparent blur-3xl pointer-events-none rounded-full`}></div>

             <div className="flex flex-col lg:flex-row items-start justify-between gap-10 relative z-10">
                 
                 <div className="w-full lg:w-auto flex justify-center items-end gap-2 md:gap-4 pb-4 mx-auto">
                     <div className="flex flex-col items-center justify-end">
                         {renderCard(1, 2, "w-24 h-36 md:w-32 md:h-48", "w-28 md:w-40")}
                         <div className="h-4 w-full mt-2 bg-gradient-to-t from-slate-200/50 to-transparent dark:from-slate-800/50 rounded-t-lg mx-2 opacity-50"></div>
                     </div>

                     <div className="flex flex-col items-center justify-end -mb-8 z-10">
                         <div className="mb-2">
                             <svg className="w-6 h-6 text-yellow-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                         </div>
                         {renderCard(0, 1, "w-32 h-48 md:w-44 md:h-64 shadow-2xl", "w-40 md:w-56")}
                         <div className="h-8 w-full mt-2 bg-gradient-to-t from-amber-200/50 to-transparent dark:from-amber-900/40 rounded-t-lg mx-2 opacity-50"></div>
                     </div>

                     <div className="flex flex-col items-center justify-end">
                         {renderCard(2, 3, "w-24 h-36 md:w-32 md:h-48", "w-28 md:w-40")}
                         <div className="h-2 w-full mt-2 bg-gradient-to-t from-orange-200/50 to-transparent dark:from-orange-900/40 rounded-t-lg mx-2 opacity-50"></div>
                     </div>
                 </div>

                 <div className="flex flex-row lg:flex-col items-center lg:items-end justify-center gap-4 w-full lg:w-auto mt-6 lg:mt-0 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 pt-6 lg:pt-0 lg:pl-6">
                     <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 lg:text-right w-full text-center">Bonus</div>
                     <div className="flex gap-4">
                         {renderBonusSlot(3)}
                         {renderBonusSlot(4)}
                     </div>
                 </div>

             </div>
        </div>
    </div>
  );
};

export default TopFavorites;