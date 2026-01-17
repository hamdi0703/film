import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ReviewProvider } from './context/ReviewContext';
import { CollectionProvider, useCollectionContext } from './context/CollectionContext';
import { AuthProvider } from './context/AuthContext';
import { TmdbService } from './services/tmdbService';
import { Movie, Genre, MediaType } from './types';
import Header from './components/Header';
import ProfileModal, { ProfileTab } from './components/ProfileModal';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './services/supabaseClient';
import { DetailSkeleton } from './components/skeletons/Skeletons'; // Reusing existing skeleton

// --- PERFORMANCE: Code Splitting (Lazy Loading) ---
const MovieDetailView = lazy(() => import('./components/MovieDetailView'));
const ExploreView = lazy(() => import('./components/views/ExploreView'));
const DashboardView = lazy(() => import('./components/views/DashboardView'));

// Simple Loading Spinner for View Transitions
const ViewLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-4 border-neutral-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const AppContent: React.FC = () => {
  // --- View State ---
  const [viewMode, setViewMode] = useState<'explore' | 'dashboard'>('explore');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>('PROFILE');
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
    const cloudListId = params.get('list');

    if (cloudListId) {
        loadCloudList(cloudListId).then(() => {
            setViewMode('dashboard');
        });
    } else if (sharedIds) {
        loadSharedList(sharedIds.split(',')).then(() => {
           setViewMode('dashboard');
        });
    }
  }, [loadSharedList, loadCloudList]);

  // LISTEN FOR PASSWORD RECOVERY
  useEffect(() => {
    // 1. Event Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        showToast('Lütfen yeni şifrenizi belirleyin.', 'info');
        setProfileInitialTab('SECURITY');
        setIsProfileOpen(true);
      }
    });

    // 2. Manual Hash Check (Fallback)
    const checkRecoveryHash = () => {
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
             setTimeout(() => {
                showToast('Şifre sıfırlama modu algılandı.', 'info');
                setProfileInitialTab('SECURITY');
                setIsProfileOpen(true);
             }, 500);
        }
    };
    checkRecoveryHash();

    return () => {
      subscription.unsubscribe();
    };
  }, [showToast]);

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

  const handleCloseProfile = () => {
      setIsProfileOpen(false);
      setTimeout(() => setProfileInitialTab('PROFILE'), 300);
  };

  // Detail View Overlay
  if (selectedMovie) {
    return (
      <div className="min-h-screen font-sans">
         <Suspense fallback={<DetailSkeleton />}>
            <MovieDetailView 
                movieId={selectedMovie.id}
                type={selectedMediaType} 
                onBack={() => setSelectedMovie(null)}
            />
         </Suspense>
      </div>
    );
  }

  const listCount = collections.find(c => c.id === activeCollectionId)?.movies.length || 0;

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16 md:pb-0">
      
      {isProfileOpen && (
          <ProfileModal 
            onClose={handleCloseProfile} 
            onResetApp={resetAppData}
            initialTab={profileInitialTab}
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
        <ErrorBoundary>
            <Suspense fallback={<ViewLoader />}>
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
            </Suspense>
        </ErrorBoundary>
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
                <ErrorBoundary fullHeight>
                   <AppContent />
                </ErrorBoundary>
            </CollectionProvider>
          </ReviewProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;