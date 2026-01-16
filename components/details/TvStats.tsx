import React from 'react';

interface TvStatsProps {
  seasons?: number;
  episodes?: number;
}

const TvStats: React.FC<TvStatsProps> = ({ seasons, episodes }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{seasons || 0}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Sezon</div>
        </div>
        <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{episodes || 0}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Bölüm</div>
        </div>
    </div>
  );
};

export default TvStats;