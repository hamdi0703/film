
import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
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

// Lazy Loading Views
const MovieDetailView = lazy(() => import('./components/MovieDetailView'));
const ExploreView = lazy(() => import('./components/views/ExploreView'));
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const SharedListView = lazy(() => import('./components/views/SharedListView'));
const AdminView = lazy(() => import('./components/views/AdminView')); // Added AdminView

const ViewLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-4 border-neutral-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const AppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<'explore' | 'dashboard' | 'shared' | 'admin'>(() => {
      const params = new URLSearchParams(window.location.search);
      const hasShareLink = params.get('collection') || params.get('list') || params.get('ids');
      return hasShareLink ? 'shared' : 'explore';
  });

  const [isSharedLoading, setIsSharedLoading] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return !!(params.get('collection') || params.get('list') || params.get('ids'));
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>('PROFILE');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('movie');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const { showToast } = useToast();
  const { loadSharedList, loadCloudList, loadCollectionByToken, exitSharedMode, resetCollections } = useCollectionContext();

  const urlCheckRef = useRef(false);

  useEffect(() => {
    const tmdb = new TmdbService();
    tmdb.getGenres('movie')
      .then(res => setGenres(res.genres))
      .catch(err => console.error("Failed to load genres", err));
  }, []);

  // --- ROUTING LOGIC ---
  useEffect(() => {
    if (urlCheckRef.current) return; 
    urlCheckRef.current = true;

    const checkUrl = async () => {
        const params = new URLSearchParams(window.location.search);
        
        const token = params.get('collection');
        const legacyListId = params.get('list');
        const legacyIds = params.get('ids');

        if (token) {
            setIsSharedLoading(true);
            try {
                const success = await loadCollectionByToken(token);
                if (success) {
                    setViewMode('shared');
                } else {
                    showToast('Liste bulunamadı veya gizli.', 'error');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('collection');
                    window.history.replaceState({}, '', url.pathname);
                    setViewMode('explore');
                }
            } catch (e) {
                showToast('Hata oluştu.', 'error');
                setViewMode('explore');
            } finally {
                setIsSharedLoading(false);
            }
        }
        else if (legacyListId) {
            setIsSharedLoading(true);
            try {
                const success = await loadCloudList(legacyListId);
                if (success) {
                    setViewMode('shared');
                } else {
                    showToast('Arşivlenmiş liste bulunamadı.', 'error');
                    setViewMode('explore');
                }
            } catch (e) {
                setViewMode('explore');
            } finally {
                setIsSharedLoading(false);
            }
        } else if (legacyIds) {
            setIsSharedLoading(true);
            await loadSharedList(legacyIds.split(','));
            setIsSharedLoading(false);
            setViewMode('shared');
        }
    };
    
    if (isSharedLoading) {
        checkUrl();
    }
  }, [loadCollectionByToken, loadCloudList, loadSharedList, showToast]); 

  // Password Recovery Logic
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        showToast('Lütfen yeni şifrenizi belirleyin.', 'info');
        setProfileInitialTab('SECURITY');
        setIsProfileOpen(true);
      }
    });

    if (window.location.hash && window.location.hash.includes('type=recovery')) {
         setTimeout(() => {
            showToast('Şifre sıfırlama modu algılandı.', 'info');
            setProfileInitialTab('SECURITY');
            setIsProfileOpen(true);
         }, 500);
    }
    return () => { subscription.unsubscribe(); };
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
      
      const url = new URL(window.location.href);
      url.searchParams.delete('collection');
      url.searchParams.delete('list');
      url.searchParams.delete('ids');
      window.history.pushState({}, '', url.pathname);
  };

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

  const renderContent = () => {
      if (isSharedLoading) return <ViewLoader />;
      
      switch (viewMode) {
          case 'admin':
              return <AdminView />;
          case 'dashboard':
              return <DashboardView onSelectMovie={handleMovieSelect} genres={genres} />;
          case 'shared':
              return <SharedListView onSelectMovie={handleMovieSelect} genres={genres} onBack={handleExitSharedMode} />;
          case 'explore':
          default:
              return <ExploreView searchQuery={searchQuery} genres={genres} onSelectMovie={handleMovieSelect} />;
      }
  };

  // Safe cast for Header prop since admin mode is internal
  const headerViewMode = (viewMode === 'shared' ? 'explore' : viewMode) as 'explore' | 'dashboard' | 'admin';

  return (
    <div className="min-h-screen flex flex-col font-sans pb-16 md:pb-0">
      
      {isProfileOpen && (
          <ProfileModal 
            onClose={handleCloseProfile} 
            onResetApp={resetAppData}
            initialTab={profileInitialTab}
          />
      )}
      
      {viewMode !== 'shared' && !isSharedLoading && (
        <Header 
            onSearchToggle={() => {
                setIsSearchVisible(!isSearchVisible);
                if(isSearchVisible) setSearchQuery('');
            }}
            isSearchVisible={isSearchVisible}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={headerViewMode}
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

      {viewMode !== 'shared' && !isSharedLoading && (
          <BottomNav 
            viewMode={headerViewMode}
            setViewMode={(mode) => setViewMode(mode)}
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
