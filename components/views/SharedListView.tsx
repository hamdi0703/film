
import React, { useMemo, useState } from 'react';
import { useCollectionContext } from '../../context/CollectionContext';
import { Movie, Genre, MediaType } from '../../types';
import MovieCard from '../MovieCard';
import { useAuth } from '../../context/AuthContext';
import MediaTypeNavbar from '../MediaTypeNavbar';
import CollectionAnalytics from '../analytics/CollectionAnalytics'; 
import TopFavorites from '../dashboard/TopFavorites';
import ErrorBoundary from '../ErrorBoundary';
import { useTheme } from '../../context/ThemeContext'; 

interface SharedListViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
  onBack: () => void;
}

type TabOption = 'movie' | 'tv';

const SharedListView: React.FC<SharedListViewProps> = ({ onSelectMovie, genres, onBack }) => {
  const { 
      sharedList, 
      checkIsSelected, 
      toggleMovieInCollection 
  } = useCollectionContext();
  
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme(); 
  
  const [activeTab, setActiveTab] = useState<TabOption>('movie');

  const allMovies = useMemo(() => sharedList?.movies || [], [sharedList]);

  const filteredMovies = useMemo(() => {
      return allMovies.filter(m => {
          const isTv = !!(m.name || m.first_air_date);
          return activeTab === 'tv' ? isTv : !isTv;
      });
  }, [allMovies, activeTab]);

  // DÜZELTME: Otomatik doldurma (Auto-fill) kaldırıldı.
  // Artık sadece veritabanında gerçekten kayıtlı olan slotlar gelecek.
  const showcaseFavorites = useMemo(() => {
      if (!sharedList) return [null, null, null, null, null];
      
      return activeTab === 'movie' 
        ? (sharedList.topFavoriteMovies || [null, null, null, null, null])
        : (sharedList.topFavoriteShows || [null, null, null, null, null]);
  }, [sharedList, activeTab]);

  // Vitrinde gösterilecek en az 1 film var mı kontrolü
  const hasShowcaseContent = useMemo(() => {
      return showcaseFavorites.some(id => id !== null);
  }, [showcaseFavorites]);

  const isOwner = useMemo(() => {
      if (!user || !sharedList) return false;
      return user.id === sharedList.ownerId;
  }, [user, sharedList]);

  if (!sharedList) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4 relative">
            <div className="absolute top-4 right-4 z-50">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm hover:scale-105 transition-transform"
                    aria-label="Tema Değiştir"
                >
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707M12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Liste Erişilemiyor</h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
                Bu liste gizli olabilir veya silinmiş.
            </p>
            <button 
                onClick={onBack} 
                className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
                Tria Anasayfasına Dön
            </button>
        </div>
    );
  }

  return (
    <div className="animate-slide-in-up pb-20 pt-4 max-w-6xl mx-auto relative">
      
      <div className="fixed top-6 right-6 z-[60]">
        <button 
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-lg border border-white/20 dark:border-white/10 text-neutral-900 dark:text-white hover:scale-105 transition-transform"
        >
            {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707M12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
      </div>
      
      {/* BAŞLIK */}
      <div className="text-center mb-10 px-4 pt-8 md:pt-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              {isOwner ? 'Sizin Listeniz (Önizleme)' : 'Paylaşılan Koleksiyon'}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight leading-tight">
              {sharedList.name}
          </h1>
          
          {sharedList.description && (
              <p className="text-sm md:text-base text-neutral-500 max-w-lg mx-auto mb-4 italic">
                  "{sharedList.description}"
              </p>
          )}

          {/* SAHİBİ İÇİN KONTROL BUTONU */}
          {isOwner && (
              <div className="mb-6 animate-pulse">
                  <button 
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform"
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Listeyi Yönet
                  </button>
              </div>
          )}
          
          <div className="flex flex-col items-center gap-1 mb-6">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Hazırlayan</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
                  {sharedList.owner || 'Anonim'}
              </span>
          </div>

          {!sharedList.isPublic && isOwner && (
              <div className="max-w-md mx-auto bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-6">
                  Bu liste şu an <strong>Gizli</strong>. Sadece siz görebilirsiniz. Başkalarıyla paylaşmak için ayarlardan "Herkese Açık" yapın.
              </div>
          )}
          
          <p className="text-neutral-700 dark:text-neutral-300 max-w-lg mx-auto text-base md:text-lg leading-relaxed font-medium opacity-90">
             Bu koleksiyonda toplam <strong>{allMovies.length}</strong> yapım bulunmaktadır.
          </p>
      </div>

      <MediaTypeNavbar 
         activeType={activeTab} 
         onChange={(t) => setActiveTab(t)} 
      />

      {filteredMovies.length > 0 ? (
          <>
            {/* SADECE EĞER VİTRİN DOLUYSA GÖSTER */}
            {hasShowcaseContent && (
                <div className="mb-12">
                    <TopFavorites 
                        favorites={showcaseFavorites}
                        collectionMovies={filteredMovies}
                        onSlotClick={() => {}} 
                        type={activeTab}
                        readOnly={true} 
                    />
                </div>
            )}

            <div className="mb-12">
                 <ErrorBoundary>
                    <CollectionAnalytics 
                        movies={filteredMovies} 
                        genres={genres}
                    />
                 </ErrorBoundary>
            </div>

            <div className="mb-8">
                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 px-1 flex items-center gap-2">
                    <span className={`w-1 h-6 rounded-full ${activeTab === 'movie' ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                    Tüm {activeTab === 'movie' ? 'Filmler' : 'Diziler'}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 px-4">
                    {filteredMovies.map((movie) => (
                        <MovieCard 
                            key={movie.id}
                            movie={movie} 
                            isSelected={checkIsSelected(movie.id)}
                            onToggleSelect={toggleMovieInCollection}
                            onClick={onSelectMovie} 
                            allGenres={genres}
                            mediaType={activeTab}
                        />
                    ))}
                </div>
            </div>
          </>
      ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 mx-4">
             <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
             </div>
             <p className="font-medium">Bu listede hiç {activeTab === 'movie' ? 'film' : 'dizi'} bulunmuyor.</p>
          </div>
      )}

      <div className="mt-24 pt-12 border-t border-neutral-200 dark:border-neutral-800 text-center">
           <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Beğendiniz mi?</h3>
           <p className="text-neutral-500 dark:text-neutral-400 mb-8">Siz de kendi film ve dizi koleksiyonunuzu oluşturun.</p>
           
           <div className="flex justify-center gap-4">
               <button 
                    onClick={onBack}
                    className="px-8 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform shadow-xl"
               >
                   {user ? 'Koleksiyonuma Dön' : 'Tria\'yı Keşfet'}
               </button>
           </div>
           
           <div className="mt-12 opacity-50">
                <span className="text-xs font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-600">Tria.</span>
           </div>
      </div>
    </div>
  );
};

export default SharedListView;
