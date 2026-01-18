import React, { useMemo } from 'react';
import { Movie, Genre } from '../../types';

interface CollectionAnalyticsProps {
  movies: Movie[];
  genres: Genre[];
}

const CollectionAnalytics: React.FC<CollectionAnalyticsProps> = ({ movies, genres }) => {
  
  // --- MERKEZİ HESAPLAMA MOTORU ---
  const stats = useMemo(() => {
    if (!movies || movies.length === 0) return null;

    let totalMinutes = 0;
    let totalRating = 0;
    let ratedCount = 0;
    const genreCounts: Record<number, number> = {};
    const decadeCounts: Record<string, number> = {};
    const countryCounts: Record<string, { name: string; count: number; code: string }> = {};

    movies.forEach(m => {
        // 1. Süre Hesaplama
        let duration = 0;
        if (m.name || m.first_air_date) { // TV
            const epLen = (m.episode_run_time && m.episode_run_time.length > 0) ? m.episode_run_time[0] : (m.runtime || 42);
            duration = (m.number_of_episodes || 1) * epLen;
        } else { // Movie
            duration = m.runtime || 0;
        }
        totalMinutes += duration;

        // 2. Puan Hesaplama
        if (m.vote_average > 0) {
            totalRating += m.vote_average;
            ratedCount++;
        }

        // 3. Tür Dağılımı
        const ids = m.genre_ids || m.genres?.map(g => g.id) || [];
        ids.forEach(id => {
            genreCounts[id] = (genreCounts[id] || 0) + 1;
        });

        // 4. Dönem (Decade) Analizi
        const dateString = m.release_date || m.first_air_date;
        if (dateString) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const decade = Math.floor(year / 10) * 10;
                const label = `${decade}'ler`;
                decadeCounts[label] = (decadeCounts[label] || 0) + 1;
            }
        }

        // 5. Coğrafya
        if (m.production_countries && m.production_countries.length > 0) {
            m.production_countries.forEach(c => {
                 if (!countryCounts[c.iso_3166_1]) {
                     countryCounts[c.iso_3166_1] = { name: c.name, count: 0, code: c.iso_3166_1 };
                 }
                 countryCounts[c.iso_3166_1].count += 1;
            });
        }
    });

    // Veri Formatlama ve Sıralama
    const sortedGenres = Object.entries(genreCounts)
        .map(([id, count]) => ({
            name: genres.find(g => g.id === parseInt(id))?.name || 'Diğer',
            count,
            percent: (count / movies.length) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    const sortedDecades = Object.entries(decadeCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.label.localeCompare(a.label)); // Yeniden eskiye

    const sortedCountries = Object.values(countryCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '-';
    const totalHours = Math.floor(totalMinutes / 60);

    return {
        totalCount: movies.length,
        totalHours,
        avgRating,
        genres: sortedGenres,
        decades: sortedDecades,
        countries: sortedCountries
    };
  }, [movies, genres]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
        {/* SOL KOLON: KPI ve Türler */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* KPI Kartları */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Toplam Süre</div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {stats.totalHours}<span className="text-sm font-medium text-neutral-500 ml-1">saat</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Ort. Puan</div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.avgRating}</span>
                        <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    </div>
                </div>
            </div>

            {/* Tür Dağılımı (Progress Bars) */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                    Tür Dağılımı
                </h3>
                <div className="space-y-5">
                    {stats.genres.map((genre, idx) => (
                        <div key={idx} className="group">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span className="text-neutral-700 dark:text-neutral-300">{genre.name}</span>
                                <span className="text-neutral-400">{genre.count}</span>
                            </div>
                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 group-hover:bg-indigo-400" 
                                    style={{ width: `${genre.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* ORTA KOLON: Zaman Tüneli (Histogram) */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                Zaman Tüneli
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 min-h-[200px] px-2">
                {stats.decades.map((decade, idx) => {
                    const maxCount = Math.max(...stats.decades.map(d => d.count));
                    const heightPercent = Math.max((decade.count / maxCount) * 100, 10);
                    
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full flex justify-center">
                                <div 
                                    className="w-full max-w-[24px] bg-teal-500/20 dark:bg-teal-500/20 rounded-t-lg group-hover:bg-teal-500/40 transition-colors relative overflow-hidden"
                                    style={{ height: `${heightPercent * 2}px` }}
                                >
                                    <div className="absolute bottom-0 left-0 right-0 bg-teal-500 h-full opacity-60"></div>
                                </div>
                                <div className="absolute -top-6 text-[10px] font-bold text-neutral-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {decade.count}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-400 mt-2 -rotate-45 origin-left translate-y-2">{decade.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* SAĞ KOLON: Coğrafya (List) */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
                Yapım Ülkeleri
            </h3>
            <div className="space-y-4">
                {stats.countries.map((country, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <img 
                                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} 
                                alt={country.name}
                                className="w-8 h-6 object-cover rounded shadow-sm opacity-90"
                            />
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                                {country.name === 'United States of America' ? 'ABD' : country.name === 'United Kingdom' ? 'Birleşik Krallık' : country.name}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 px-2 py-1 rounded-md shadow-sm border border-neutral-100 dark:border-neutral-600">
                            {country.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
};

export default CollectionAnalytics;