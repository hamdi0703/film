import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ReviewProvider } from './context/ReviewContext';
import { CollectionProvider, useCollectionContext } from './context/CollectionContext';
import { AuthProvider } from './context/AuthContext';
import { TmdbService } from './services/tmdbService';
import { Movie, Genre, MediaType } from './types';
import Header from './components/Header';
import ProfileModal from './components/ProfileModal';
import MovieDetailView from './components/MovieDetailView';
import ExploreView from './components/views/ExploreView';
import DashboardView from './components/views/DashboardView';
import BottomNav from './components/BottomNav';

const AppContent: React.FC = () => {
  // --- View State ---
  const [viewMode, setViewMode] = useState<'explore' | 'dashboard'>('explore');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('movie');

  // --- Shared Data ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const { showToast } = useToast();
  const { collections, activeCollectionId, loadSharedList, loadCloudList, resetCollections } = useCollectionContext();

  // Load Genres Globally
  useEffect(() => {
    const tmdb = new TmdbService();
    tmdb.getGenres('movie')
      .then(res => setGenres(res.genres))
      .catch(err => console.error("Failed to load genres", err));
  }, []);

  // Shared List Loading Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedIds = params.get('ids');
    const cloudListCode = params.get('list'); // Changed from 'id' to 'list' based on new requirement

    if (cloudListCode) {
        // Load persistent cloud list by 16-char CODE
        loadCloudList(cloudListCode).then(() => {
            setViewMode('dashboard');
        });
    } else if (sharedIds) {
        // Load legacy/guest shared list
        loadSharedList(sharedIds.split(',')).then(() => {
           setViewMode('dashboard');
        });
    }
  }, [loadSharedList, loadCloudList]);


  const handleMovieSelect = (movie: Movie) => {
      const type = (movie.first_air_date || movie.name) ? 'tv' : 'movie';
      setSelectedMediaType(type);
      setSelectedMovie(movie);
  };

  const resetAppData = () => {
      resetCollections();
      setIsProfileOpen(false);
      localStorage.removeItem('vista-theme');
      setSelectedMovie(null);
      showToast('Uygulama sıfırlandı', 'info');
  };

  // Detail View Overlay
  if (selectedMovie) {
    return (
      <div className="min-h-screen font-sans">
         <MovieDetailView 
            movieId={selectedMovie.id}
            type={selectedMediaType} 
            onBack={() => setSelectedMovie(null)}
         />
      </div>
    );
  }

  const listCount = collections.find(c => c.id === activeCollectionId)?.movies.length || 0;

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16 md:pb-0">
      
      {isProfileOpen && (
          <ProfileModal 
            onClose={() => setIsProfileOpen(false)} 
            onResetApp={resetAppData}
          />
      )}
      
      <Header 
        onSearchToggle={() => {
            setIsSearchVisible(!isSearchVisible);
            if(isSearchVisible) setSearchQuery('');
        }}
        isSearchVisible={isSearchVisible}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        setViewMode={(mode) => {
            setViewMode(mode);
            if(mode === 'dashboard' && searchQuery) setSearchQuery('');
        }}
        listCount={listCount}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {viewMode === 'dashboard' ? (
            <DashboardView 
                onSelectMovie={handleMovieSelect}
                genres={genres}
            />
        ) : (
            <ExploreView 
                searchQuery={searchQuery}
                genres={genres}
                onSelectMovie={handleMovieSelect}
            />
        )}
      </main>

      <BottomNav 
        viewMode={viewMode}
        setViewMode={setViewMode}
        listCount={listCount}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ReviewProvider>
            <CollectionProvider>
              <AppContent />
            </CollectionProvider>
          </ReviewProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;