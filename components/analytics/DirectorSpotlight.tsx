import React, { useMemo } from 'react';
import { Movie } from '../../types';
import AnalyticsCard, { AnalyticsItem } from './AnalyticsCard';

interface DirectorSpotlightProps {
  movies: Movie[];
}

const DirectorSpotlight: React.FC<DirectorSpotlightProps> = ({ movies }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];

    const directorCounts: Record<number, { name: string; count: number; image: string | null }> = {};

    movies.forEach(m => {
      let foundCreator = false;

      // 1. Try to find "Director" in crew (Movies)
      if (m.credits?.crew) {
          const director = m.credits.crew.find(c => c.job === 'Director');
          if (director) {
             if (!directorCounts[director.id]) {
                directorCounts[director.id] = { 
                  name: director.name, 
                  count: 0, 
                  image: director.profile_path || null
                };
             }
             directorCounts[director.id].count += 1;
             foundCreator = true;
          }
      }

      // 2. If not found, check "Created By" (TV Shows)
      if (!foundCreator && m.created_by && m.created_by.length > 0) {
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
          image: d.image, // AnalyticsCard handles null images by showing initials
          // icon property removed to let AnalyticsCard use image or initial
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