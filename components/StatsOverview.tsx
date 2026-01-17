import React, { useMemo } from 'react';
import { Movie } from '../types';
import { useReviewContext } from '../context/ReviewContext';

interface StatsOverviewProps {
  movies: Movie[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ movies }) => {
  const { reviews } = useReviewContext();
  
  const stats = useMemo(() => {
    if (!movies || movies.length === 0) return null;

    const totalTmdbRating = movies.reduce((acc, movie) => acc + (movie.vote_average || 0), 0);
    const avgTmdbRating = (totalTmdbRating / movies.length).toFixed(1);

    const userRatings = movies
        .map(m => reviews[m.id]?.rating)
        .filter((r): r is number => r !== undefined && r > 0);
    
    const avgUserRating = userRatings.length > 0 
        ? (userRatings.reduce((a, b) => a + b, 0) / userRatings.length).toFixed(1) 
        : null;

    // Robust Runtime Calculation
    const totalMinutes = movies.reduce((acc, m) => {
        let duration = 0;
        if (m.name || m.first_air_date) {
            // TV Logic: Try episode_run_time array, then runtime, then fallback
            const epLen = (m.episode_run_time && m.episode_run_time.length > 0) ? m.episode_run_time[0] : (m.runtime || 42);
            duration = (m.number_of_episodes || 1) * epLen;
        } else {
            // Movie Logic: Try runtime, fallback 0
            duration = m.runtime || 0;
        }
        return acc + duration;
    }, 0);

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);

    return { 
        avgTmdbRating,
        avgUserRating,
        userRatingCount: userRatings.length,
        watchTime: { days, hours, totalMinutes },
        totalMovies: movies.length
    };
  }, [movies, reviews]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in h-full">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-sm">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ortalama Puanlar</span>
        <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    <span className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">{stats.avgTmdbRating}</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium ml-0.5">Global (TMDB)</span>
            </div>
            <div className="w-px h-10 bg-neutral-100 dark:bg-neutral-800"></div>
            <div className="flex flex-col items-end">
                 {stats.avgUserRating ? (
                    <>
                        <div className="flex items-center gap-1.5">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">{stats.avgUserRating}</span>
                             <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium mr-0.5">Sizin Puanınız ({stats.userRatingCount})</span>
                    </>
                 ) : (
                    <span className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight opacity-30">--</span>
                 )}
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider relative z-10">Maraton Süresi</span>
        <div className="mt-2 relative z-10">
            {stats.watchTime.totalMinutes > 0 ? (
                <div className="flex items-baseline gap-1 text-neutral-900 dark:text-white">
                    {stats.watchTime.days > 0 && <><span className="text-3xl font-bold tracking-tight">{stats.watchTime.days}</span><span className="text-xs text-neutral-500 mr-2 font-medium">gün</span></>}
                    <span className="text-3xl font-bold tracking-tight">{stats.watchTime.hours}</span><span className="text-xs text-neutral-500 font-medium">saat</span>
                </div>
            ) : (
                <div className="flex flex-col"><span className="text-lg font-bold text-neutral-400">Veri Bekleniyor</span></div>
            )}
             <p className="text-[10px] text-neutral-500 mt-1 font-medium">Toplam {stats.totalMovies} yapım</p>
        </div>
        <div className="absolute -bottom-4 -right-4 text-indigo-500/5 dark:text-indigo-500/10">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8zm0-18c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm1 5h-2v6h6v-2h-4z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;