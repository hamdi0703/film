import React, { useMemo } from 'react';
import { Movie } from '../../types';
import AnalyticsCard, { AnalyticsItem } from './AnalyticsCard';

interface CountrySpotlightProps {
  movies: Movie[];
}

const CountrySpotlight: React.FC<CountrySpotlightProps> = ({ movies }) => {
  const data: AnalyticsItem[] = useMemo(() => {
    if (!movies) return [];

    const countryCounts: Record<string, { name: string; count: number; code: string }> = {};

    movies.forEach(m => {
      if (m.production_countries && m.production_countries.length > 0) {
        m.production_countries.forEach(country => {
            const code = country.iso_3166_1;
            if (!countryCounts[code]) {
                countryCounts[code] = { 
                    name: country.name, 
                    count: 0, 
                    code: code
                };
            }
            countryCounts[code].count += 1;
        });
      }
    });

    return Object.values(countryCounts)
      .map(c => {
          const displayName = c.name === 'United States of America' ? 'USA' : 
                              c.name === 'United Kingdom' ? 'UK' : c.name;
          return {
              id: c.code,
              label: displayName,
              count: c.count,
              image: `https://flagcdn.com/w80/${c.code.toLowerCase()}.png`
          };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

  }, [movies]);

  return (
    <AnalyticsCard 
        title="Coğrafya"
        subtitle="Yapım Ülkeleri"
        data={data}
        theme="green"
        type="image"
    />
  );
};

export default CountrySpotlight;