import React from 'react';
import { MediaType } from '../types';

interface MediaTypeNavbarProps {
  activeType: MediaType;
  onChange: (type: MediaType) => void;
}

const MediaTypeNavbar: React.FC<MediaTypeNavbarProps> = ({ activeType, onChange }) => {
  return (
    <div className="sticky top-20 z-30 flex justify-center mb-8 pointer-events-none">
      <div className="pointer-events-auto p-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-1">
        <button
          onClick={() => onChange('movie')}
          className={`relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            activeType === 'movie'
              ? 'text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {activeType === 'movie' && (
            <div className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full -z-10 animate-fade-in" />
          )}
          <span className={activeType === 'movie' ? 'dark:text-black' : ''}>Filmler</span>
        </button>

        <button
          onClick={() => onChange('tv')}
          className={`relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            activeType === 'tv'
              ? 'text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {activeType === 'tv' && (
            <div className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full -z-10 animate-fade-in" />
          )}
           <span className={activeType === 'tv' ? 'dark:text-black' : ''}>Diziler</span>
        </button>
      </div>
    </div>
  );
};

export default MediaTypeNavbar;