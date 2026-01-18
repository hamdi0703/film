import React, { useMemo, useState } from 'react';
import { Movie, Genre } from '../../types';
import { IMAGE_BASE_URL } from '../../services/tmdbService';

interface CollectionAnalyticsProps {
  movies: Movie[];
  genres: Genre[];
}

// --- ALT BİLEŞEN: GENİŞLETİLEBİLİR LİSTE WIDGET'I ---
interface ListWidgetProps {
  title: string;
  iconColor: string; // "bg-indigo-500" gibi
  items: { id: string | number; label: string; count: number; image?: string | null; subtext?: string }[];
  type: 'profile' | 'country' | 'simple';
  emptyMessage: string;
}

const ListWidget: React.FC<ListWidgetProps> = ({ title, iconColor, items, type, emptyMessage }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Varsayılan 5, genişleyince 10
  const limit = expanded ? 10 : 5;
  const visibleItems = items.slice(0, limit);
  const hasMore = items.length > 5;

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full transition-all hover:shadow-md duration-300">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${iconColor}`}></span>
        {title}
      </h3>
      
      <div className="space-y-3 flex-1">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <div 
                key={`${item.id}-${idx}`} 
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {type !== 'simple' && (
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-100 dark:border-neutral-700 shadow-sm">
                    {item.image ? (
                        <img 
                        src={type === 'country' ? item.image : `${IMAGE_BASE_URL}${item.image}`} 
                        alt={item.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">
                        {item.label.charAt(0)}
                        </div>
                    )}
                    </div>
                )}
                
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.label}
                    </span>
                    {item.subtext && <span className="text-[9px] text-neutral-400 truncate">{item.subtext}</span>}
                </div>
              </div>

              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md min-w-[20px] text-center">
                {item.count}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-400 text-center py-8 opacity-60 italic">{emptyMessage}</p>
        )}
      </div>

      {hasMore && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 hover:text-indigo-500 flex items-center justify-center gap-1 transition-colors uppercase tracking-wide"
        >
          {expanded ? 'Daha Az Göster' : 'Daha Fazla Göster'}
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// --- ALT BİLEŞEN: MODERN ZAMAN TÜNELİ ---
const TimelineWidget = ({ decades }: { decades: { label: string; count: number }[] }) => {
    const maxCount = Math.max(...decades.map(d => d.count), 1);
    
    return (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                    <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                        Zaman Tüneli
                    </h3>
                    <p className="text-2xl font-bold text-white">Yıllara Göre Dağılım</p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-32 px-2 relative z-10">
                {decades.length > 0 ? decades.map((decade, idx) => {
                    const heightPercent = Math.max((decade.count / maxCount) * 100, 15); // Min %15 height for visibility
                    const opacity = 0.4 + ((decade.count / maxCount) * 0.6); // Dynamic opacity based on count
                    
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center group/bar relative">
                            {/* Tooltip */}
                            <div className="absolute -top-8 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover/bar:opacity-100 transition-all transform translate-y-2 group-hover/bar:translate-y-0 z-20 whitespace-nowrap">
                                {decade.count} Yapım
                            </div>
                            
                            {/* Bar */}
                            <div 
                                className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out relative overflow-hidden hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                                style={{ 
                                    height: `${heightPercent}%`, 
                                    backgroundColor: `rgba(45, 212, 191, ${opacity})` // Teal color dynamic opacity
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                            
                            {/* Label */}
                            <span className="text-[10px] font-medium text-neutral-400 mt-3 -rotate-45 origin-left translate-x-1 whitespace-nowrap">
                                {decade.label}
                            </span>
                        </div>
                    );
                }) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">Veri Yok</div>
                )}
            </div>
        </div>
    );
};


const CollectionAnalytics: React.FC<CollectionAnalyticsProps> = ({ movies, genres }) => {
  
  // --- VERİ HESAPLAMA MOTORU ---
  const stats = useMemo(() => {
    if (!movies || movies.length === 0) return null;

    let totalMinutes = 0;
    let totalRating = 0;
    let ratedCount = 0;
    
    const genreCounts: Record<number, number> = {};
    const decadeCounts: Record<string, number> = {};
    const countryCounts: Record<string, { name: string; count: number; code: string }> = {};
    const actorCounts: Record<number, { id: number; name: string; count: number; image: string | null }> = {};
    const directorCounts: Record<number, { id: number; name: string; count: number; image: string | null }> = {};

    movies.forEach(m => {
        // 1. Süre & Puan
        let duration = 0;
        if (m.name || m.first_air_date) { // TV
            const epLen = (Array.isArray(m.episode_run_time) && m.episode_run_time.length > 0) 
                ? m.episode_run_time[0] 
                : (m.runtime || 45); 
            duration = (m.number_of_episodes || 1) * epLen;
        } else { // Movie
            duration = m.runtime || 0;
        }
        totalMinutes += duration;

        if (typeof m.vote_average === 'number' && m.vote_average > 0) {
            totalRating += m.vote_average;
            ratedCount++;
        }

        // 2. Tür
        const ids = m.genre_ids || m.genres?.map(g => g.id) || [];
        ids.forEach(id => { if (id) genreCounts[id] = (genreCounts[id] || 0) + 1; });

        // 3. Yıl
        const dateString = m.release_date || m.first_air_date;
        if (dateString) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const decade = Math.floor(year / 10) * 10;
                decadeCounts[`${decade}'ler`] = (decadeCounts[`${decade}'ler`] || 0) + 1;
            }
        }

        // 4. Ülke (Defansif)
        if (Array.isArray(m.production_countries)) {
            m.production_countries.forEach(c => {
                 if (c?.iso_3166_1) {
                     if (!countryCounts[c.iso_3166_1]) {
                         countryCounts[c.iso_3166_1] = { name: c.name, count: 0, code: c.iso_3166_1 };
                     }
                     countryCounts[c.iso_3166_1].count += 1;
                 }
            });
        }

        // 5. Oyuncular (Defansif)
        const castList = m.credits?.cast || [];
        if (castList.length > 0) {
            castList.slice(0, 8).forEach(actor => { // Sadece başrollerin ağırlığı
                if (actor?.id) {
                    if (!actorCounts[actor.id]) {
                        actorCounts[actor.id] = { id: actor.id, name: actor.name, count: 0, image: actor.profile_path };
                    }
                    actorCounts[actor.id].count += 1;
                }
            });
        }

        // 6. Yönetmenler
        const crewList = m.credits?.crew || [];
        const creatorsList = m.created_by || [];
        
        crewList.filter(c => c.job === 'Director').forEach(d => {
            if (d?.id) {
                if (!directorCounts[d.id]) {
                    directorCounts[d.id] = { id: d.id, name: d.name, count: 0, image: d.profile_path };
                }
                directorCounts[d.id].count += 1;
            }
        });

        creatorsList.forEach(creator => {
            if (creator?.id) {
                if (!directorCounts[creator.id]) {
                    directorCounts[creator.id] = { id: creator.id, name: creator.name, count: 0, image: creator.profile_path };
                }
                directorCounts[creator.id].count += 1;
            }
        });
    });

    // --- SORTING ---
    const sortedGenres = Object.entries(genreCounts)
        .map(([id, count]) => ({
            id: parseInt(id),
            label: genres.find(g => g.id === parseInt(id))?.name || 'Diğer',
            count
        }))
        .sort((a, b) => b.count - a.count);

    const sortedDecades = Object.entries(decadeCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label)); // Kronolojik Sıra

    const sortedCountries = Object.values(countryCounts)
        .sort((a, b) => b.count - a.count)
        .map(c => ({
            id: c.code,
            label: c.name === 'United States of America' ? 'ABD' : c.name === 'United Kingdom' ? 'UK' : c.name,
            count: c.count,
            image: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`
        }));

    const sortedActors = Object.values(actorCounts)
        .sort((a, b) => b.count - a.count)
        .map(a => ({ id: a.id, label: a.name, count: a.count, image: a.image }));

    const sortedDirectors = Object.values(directorCounts)
        .sort((a, b) => b.count - a.count)
        .map(d => ({ id: d.id, label: d.name, count: d.count, image: d.image }));

    const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '-';
    const totalHours = Math.floor(totalMinutes / 60);

    return {
        totalCount: movies.length,
        totalHours,
        avgRating,
        genres: sortedGenres,
        decades: sortedDecades,
        countries: sortedCountries,
        actors: sortedActors,
        directors: sortedDirectors
    };
  }, [movies, genres]);

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in mb-12">
        
        {/* ROW 1: KPI HEADER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Toplam İçerik</span>
                <span className="text-2xl font-black text-neutral-900 dark:text-white">{stats.totalCount}</span>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Toplam Süre</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-neutral-900 dark:text-white">{stats.totalHours}</span>
                    <span className="text-xs font-bold text-neutral-500">saat</span>
                </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Ort. Puan</span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-neutral-900 dark:text-white">{stats.avgRating}</span>
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                </div>
            </div>
            <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1 relative z-10">Favori Tür</span>
                <span className="text-xl font-black text-white truncate relative z-10">
                    {stats.genres[0]?.label || '-'}
                </span>
            </div>
        </div>

        {/* ROW 2: TIMELINE (WIDE) */}
        <TimelineWidget decades={stats.decades} />

        {/* ROW 3: LISTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <ListWidget 
                title="Yönetmenler" 
                iconColor="bg-amber-500" 
                items={stats.directors} 
                type="profile"
                emptyMessage="Yönetmen verisi bulunamadı."
            />

            <ListWidget 
                title="Oyuncular" 
                iconColor="bg-purple-500" 
                items={stats.actors} 
                type="profile"
                emptyMessage="Oyuncu verisi bulunamadı."
            />

            <ListWidget 
                title="Tür Dağılımı" 
                iconColor="bg-indigo-500" 
                items={stats.genres} 
                type="simple"
                emptyMessage="Tür verisi yok."
            />

            <ListWidget 
                title="Yapım Ülkeleri" 
                iconColor="bg-rose-500" 
                items={stats.countries} 
                type="country"
                emptyMessage="Ülke verisi yok."
            />

        </div>

    </div>
  );
};

export default CollectionAnalytics;