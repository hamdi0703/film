import React, { useMemo } from 'react';
import { Movie, Genre } from '../types';
import AnalyticsCard, { AnalyticsItem } from './analytics/AnalyticsCard';
import { getGenreIcon } from '../constants/genreIcons';

interface GenreChartProps {
  movies: Movie[];
  genres: Genre[];
  onGenreClick?: (id: number) => void;
}

const GenreChart: React.FC<GenreChartProps> = ({ movies, genres, onGenreClick }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies || !movies.length || !genres || !genres.length) return [];

    const counts: Record<number, number> = {};

    movies.forEach(m => {
      const ids = m.genre_ids || (m.genres ? m.genres.map(g => g.id) : []);
      if (ids && ids.length > 0) {
        ids.forEach(id => {
            if (genres.some(g => g.id === id)) {
                counts[id] = (counts[id] || 0) + 1;
            }
        });
      }
    });

    return Object.entries(counts)
      .map(([idStr, count]) => {
        const id = parseInt(idStr);
        const name = genres.find(g => g.id === id)?.name || 'Diğer';
        return { 
            id, 
            label: name, 
            count,
            icon: getGenreIcon(id),
            onClick: onGenreClick ? () => onGenreClick(id) : undefined
        };
      })
      .sort((a, b) => b.count - a.count);

  }, [movies, genres, onGenreClick]);

  return (
    <AnalyticsCard 
        title="Tür Dağılımı"
        subtitle="Favori Türler"
        data={data}
        theme="pink"
        type="icon"
    />
  );
};

export default GenreChart;