import React from 'react';
import { Collection } from '../types';

interface BottomNavProps {
  viewMode: 'explore' | 'dashboard';
  setViewMode: (mode: 'explore' | 'dashboard') => void;
  listCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ viewMode, setViewMode, listCount }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        
        <button 
          onClick={() => setViewMode('explore')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            viewMode === 'explore' 
              ? 'text-indigo-600 dark:text-white' 
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={viewMode === 'explore' ? 2.5 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium">Keşfet</span>
        </button>

        <button 
          onClick={() => setViewMode('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
            viewMode === 'dashboard' 
              ? 'text-indigo-600 dark:text-white' 
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={viewMode === 'dashboard' ? 2.5 : 2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {listCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {listCount}
                </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Koleksiyon</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;