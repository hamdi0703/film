import React from 'react';
import { Cast } from '../../types';
import { IMAGE_BASE_URL } from '../../services/tmdbService';

interface CastListProps {
  cast?: Cast[];
}

const CastList: React.FC<CastListProps> = ({ cast }) => {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mb-8">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-4">Oyuncular</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {cast.slice(0, 10).map(actor => (
                <div key={actor.id} className="flex-shrink-0 w-24 md:w-28 text-center group">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-md">
                        {actor.profile_path ? (
                            <img 
                                src={`${IMAGE_BASE_URL}${actor.profile_path}`} 
                                alt={actor.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-400">
                                {actor.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {actor.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">
                        {actor.character}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default CastList;