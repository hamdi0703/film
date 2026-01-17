import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';

interface HeaderProps {
  onSearchToggle: () => void;
  isSearchVisible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'explore' | 'dashboard';
  setViewMode: (mode: 'explore' | 'dashboard') => void;
  listCount: number;
  onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearchToggle, 
  isSearchVisible, 
  searchQuery, 
  onSearchChange,
  viewMode,
  setViewMode,
  listCount,
  onOpenProfile
}) => {
  const { theme, toggleTheme } = useTheme();
  // NOW USING GLOBAL STATE FROM CONTEXT
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();

  return (
    <>
      {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
      
      <header className="sticky top-0 z-40 w-full bg-vista-light/80 dark:bg-vista-dark/80 backdrop-blur-md transition-colors duration-300 border-b border-transparent dark:border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          
          {/* Brand & Nav */}
          <div className="flex items-center gap-6 flex-shrink-0">
              <h1 
                  onClick={() => {
                    setViewMode('explore');
                    onSearchChange('');
                  }}
                  className="text-3xl font-bold tracking-tighter text-neutral-900 dark:text-white select-none cursor-pointer hover:opacity-80 transition-opacity"
              >
              Tria.
              </h1>

              {/* Desktop Nav */}
              <nav className="hidden md:flex bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1">
                  <button
                      onClick={() => {
                        setViewMode('explore');
                        onSearchChange('');
                      }}
                      className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          viewMode === 'explore' 
                          ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                  >
                      Keşfet
                  </button>
                  <button
                      onClick={() => setViewMode('dashboard')}
                      className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          viewMode === 'dashboard' 
                          ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                  >
                      Koleksiyon
                      {listCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viewMode === 'dashboard' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-300 dark:bg-neutral-600 text-black dark:text-white'}`}>
                              {listCount}
                          </span>
                      )}
                  </button>
              </nav>
          </div>

          {/* Search Bar - Centered & Wide */}
          <div className="flex-1 max-w-xl mx-auto relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Film, dizi veya kişi ara..."
                className="block w-full pl-10 pr-10 py-2.5 border-none rounded-xl leading-5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner sm:text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* Mobile Search Toggle */}
            <button 
              className="sm:hidden p-2 text-neutral-900 dark:text-white"
              onClick={onSearchToggle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white"
            >
              {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
              )}
            </button>

            {/* Auth/Profile Trigger */}
            {user ? (
               <button 
                  onClick={onOpenProfile}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 transition-all border border-white/20"
                >
                  {user.user_metadata?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </button>
            ) : (
                <button
                  onClick={openAuthModal}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Giriş
                </button>
            )}
          </div>
        </div>
        
        {/* Mobile Search Expanded View */}
        <div className={`sm:hidden overflow-hidden transition-all duration-300 ${isSearchVisible ? 'h-16 border-t border-neutral-200 dark:border-neutral-800' : 'h-0'}`}>
          <div className="px-4 h-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Ne izlemek istiyorsun?"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-2 rounded-xl text-sm outline-none"
                autoFocus={isSearchVisible}
              />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;