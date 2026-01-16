import React, { useMemo } from 'react';
import { Movie } from '../../types';
import AnalyticsCard, { AnalyticsItem } from './AnalyticsCard';

interface ErasChartProps {
  movies: Movie[];
}

const ErasChart: React.FC<ErasChartProps> = ({ movies }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies || movies.length === 0) return [];

    const decades: Record<string, number> = {};

    movies.forEach(m => {
      const dateString = m.release_date || m.first_air_date;
      if (dateString) {
        // Safe Date Parsing
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const decade = Math.floor(year / 10) * 10;
            const label = `${decade}'ler`;
            decades[label] = (decades[label] || 0) + 1;
        }
      }
    });

    // Convert to array and sort by COUNT (Popularity)
    return Object.entries(decades)
      .map(([label, count]) => {
          // Logic to split "1990'ler" into metadata "19" and icon "90"
          const cleanDecade = label.substring(0, 4); // "1990"
          const prefix = cleanDecade.substring(0, 2); // "19"
          const suffix = cleanDecade.substring(2, 4); // "90"
          
          return { 
              id: label, 
              label, 
              count,
              icon: suffix,
              metadata: prefix
          };
      })
      .sort((a, b) => b.count - a.count);

  }, [movies]);

  return (
    <AnalyticsCard 
        title="Zaman Tüneli"
        subtitle="Dönemler"
        data={data}
        theme="cyan"
        type="icon"
    />
  );
};

export default ErasChart;