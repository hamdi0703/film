import React from 'react';
import { Movie, Genre } from '../types';
import MovieCard from './MovieCard';

interface FeaturedRowProps {
  title: string;
  movies: Movie[];
  onToggleSelect: (movie: Movie) => void;
  checkIsSelected: (id: number) => boolean;
  genres: Genre[];
}

const FeaturedRow: React.FC<FeaturedRowProps> = ({ title, movies, onToggleSelect, checkIsSelected, genres }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-10 animate-slide-in-right">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 px-1 flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        {title}
      </h2>
      
      <div className="relative group">
        {/* Fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-vista-light dark:from-vista-dark to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-vista-light dark:from-vista-dark to-transparent z-10 pointer-events-none"></div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1 snap-x scroll-smooth">
          {movies.map((movie) => (
            <div key={`featured-${movie.id}`} className="flex-shrink-0 w-36 sm:w-44 snap-start">
              <MovieCard 
                movie={movie} 
                isSelected={checkIsSelected(movie.id)}
                onToggleSelect={onToggleSelect}
                allGenres={genres}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedRow;