import React, { useMemo } from 'react';
import { Movie } from '../../types';
import AnalyticsCard, { AnalyticsItem } from './AnalyticsCard';

interface DirectorSpotlightProps {
  movies: Movie[];
}

const DirectorSpotlight: React.FC<DirectorSpotlightProps> = ({ movies }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies) return [];

    const directorCounts: Record<number, { name: string; count: number; image: string | null }> = {};

    movies.forEach(m => {
      const director = m.credits?.crew?.find(c => c.job === 'Director');
      if (director) {
        if (!directorCounts[director.id]) {
            directorCounts[director.id] = { 
              name: director.name, 
              count: 0, 
              image: director.profile_path || null
            };
        }
        directorCounts[director.id].count += 1;
      } else if (m.created_by && m.created_by.length > 0) {
        // Handle TV Shows
        m.created_by.forEach(creator => {
             if (!directorCounts[creator.id]) {
                directorCounts[creator.id] = {
                    name: creator.name,
                    count: 0,
                    image: creator.profile_path || null
                };
             }
             directorCounts[creator.id].count += 1;
        });
      }
    });

    return Object.values(directorCounts)
      .map((d, index) => ({
          id: index,
          label: d.name,
          count: d.count,
          image: d.image,
          icon: <svg className="w-5 h-5 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

  }, [movies]);

  return (
    <AnalyticsCard 
        title="Yönetmenler"
        subtitle="Vizyonerler"
        data={data}
        theme="amber"
        type="image"
    />
  );
};

export default DirectorSpotlight;