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
import { DetailSkeleton } from './components/skeletons/Skeletons';

// --- PERFORMANCE: Code Splitting (Lazy Loading) ---
const MovieDetailView = lazy(() => import('./components/MovieDetailView'));
const ExploreView = lazy(() => import('./components/views/ExploreView'));
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const SharedListView = lazy(() => import('./components/views/SharedListView'));

// Simple Loading Spinner for View Transitions
const ViewLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-4 border-neutral-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const AppContent: React.FC = () => {
  // --- View State ---
  const [viewMode, setViewMode] = useState<'explore' | 'dashboard' | 'shared'>('explore');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>('PROFILE');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('movie');
  const [isSharedLoading, setIsSharedLoading] = useState(false);

  // --- Shared Data ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const { showToast } = useToast();
  const { loadSharedList, loadCloudList, exitSharedMode, resetCollections } = useCollectionContext();

  // Load Genres Globally
  useEffect(() => {
    const tmdb = new TmdbService();
    tmdb.getGenres('movie')
      .then(res => setGenres(res.genres))
      .catch(err => console.error("Failed to load genres", err));
  }, []);

  // Shared List Loading Logic (URL Handler)
  // This runs ONCE on mount to check for shared links
  useEffect(() => {
    const checkUrl = async () => {
        const params = new URLSearchParams(window.location.search);
        const cloudListId = params.get('list');
        const sharedIds = params.get('ids');

        if (cloudListId) {
            setIsSharedLoading(true);
            const success = await loadCloudList(cloudListId);
            setIsSharedLoading(false);
            
            if (success) {
                setViewMode('shared');
            } else {
                showToast('Liste bulunamadı veya erişim izni yok.', 'error');
                // URL'i temizle ama sayfayı yenileme
                const url = new URL(window.location.href);
                url.searchParams.delete('list');
                window.history.replaceState({}, '', url);
            }
        } else if (sharedIds) {
            // Legacy Support
            setIsSharedLoading(true);
            await loadSharedList(sharedIds.split(','));
            setIsSharedLoading(false);
            setViewMode('shared');
        }
    };
    
    checkUrl();
  }, [loadSharedList, loadCloudList, showToast]);

  // LISTEN FOR PASSWORD RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        showToast('Lütfen yeni şifrenizi belirleyin.', 'info');
        setProfileInitialTab('SECURITY');
        setIsProfileOpen(true);
      }
    });

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
  
  const handleExitSharedMode = () => {
      exitSharedMode();
      setViewMode('explore');
      // Clean URL correctly without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('list');
      url.searchParams.delete('ids');
      window.history.pushState({}, '', url.pathname);
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

  // Determine active view content
  const renderContent = () => {
      if (isSharedLoading) {
          return <ViewLoader />;
      }
      
      switch (viewMode) {
          case 'dashboard':
              return <DashboardView onSelectMovie={handleMovieSelect} genres={genres} />;
          case 'shared':
              return <SharedListView onSelectMovie={handleMovieSelect} genres={genres} onBack={handleExitSharedMode} />;
          case 'explore':
          default:
              return <ExploreView searchQuery={searchQuery} genres={genres} onSelectMovie={handleMovieSelect} />;
      }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16 md:pb-0">
      
      {isProfileOpen && (
          <ProfileModal 
            onClose={handleCloseProfile} 
            onResetApp={resetAppData}
            initialTab={profileInitialTab}
          />
      )}
      
      {/* Conditionally render header based on View Mode to keep Shared view simple */}
      {viewMode !== 'shared' && (
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
            listCount={0}
            onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <ErrorBoundary>
            <Suspense fallback={<ViewLoader />}>
                {renderContent()}
            </Suspense>
        </ErrorBoundary>
      </main>

      {/* Hide Bottom Nav in Shared Mode for Cleaner Look */}
      {viewMode !== 'shared' && (
          <BottomNav 
            viewMode={viewMode}
            setViewMode={(mode) => {
                setViewMode(mode);
            }}
            listCount={0}
          />
      )}
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