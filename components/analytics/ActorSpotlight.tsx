import React, { useMemo } from 'react';
import { Movie } from '../../types';
import AnalyticsCard, { AnalyticsItem } from './AnalyticsCard';

interface ActorSpotlightProps {
  movies: Movie[];
}

const ActorSpotlight: React.FC<ActorSpotlightProps> = ({ movies }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];

    const actorCounts: Record<number, { name: string; count: number; image: string | null }> = {};

    movies.forEach(m => {
      // Safe access: ensure credits and cast exist before mapping
      const cast = m.credits?.cast || [];
      
      // Look at top 10 cast members per movie
      cast.slice(0, 10).forEach(actor => {
        if (!actorCounts[actor.id]) {
          actorCounts[actor.id] = { 
              name: actor.name, 
              count: 0, 
              image: actor.profile_path 
          };
        }
        actorCounts[actor.id].count += 1;
      });
    });

    return Object.values(actorCounts)
        .map((a, index) => ({
            id: index,
            label: a.name,
            count: a.count,
            image: a.image
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

  }, [movies]);

  return (
    <AnalyticsCard 
        title="Kadro"
        subtitle="Favori Oyuncular"
        data={data}
        theme="indigo"
        type="image"
    />
  );
};

export default ActorSpotlight;