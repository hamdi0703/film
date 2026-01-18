import React, { useMemo } from 'react';
import { useCollectionContext } from '../../context/CollectionContext';
import { Movie, Genre } from '../../types';
import MovieCard from '../MovieCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AuthModal from '../auth/AuthModal';

interface SharedListViewProps {
  onSelectMovie: (movie: Movie) => void;
  genres: Genre[];
  onBack: () => void;
}

const SharedListView: React.FC<SharedListViewProps> = ({ onSelectMovie, genres, onBack }) => {
  const { sharedList, toggleMovieInCollection, checkIsSelected } = useCollectionContext();
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const { showToast } = useToast();

  const movies = useMemo(() => sharedList?.movies || [], [sharedList]);

  // Handle Heart Click in Shared View
  const handleToggleSelect = (movie: Movie) => {
    if (!user) {
        showToast('Koleksiyonunuza eklemek için giriş yapmalısınız.', 'info');
        openAuthModal();
        return;
    }
    toggleMovieInCollection(movie);
    
    // Feedback Logic
    const isAlreadySelected = checkIsSelected(movie.id);
    if (!isAlreadySelected) {
        showToast('Koleksiyonunuza eklendi', 'success');
    } else {
        showToast('Koleksiyonunuzdan çıkarıldı', 'info');
    }
  };

  if (!sharedList) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in text-center px-4">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Liste Bulunamadı</h2>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
                Aradığınız liste silinmiş veya bağlantı hatalı olabilir.
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
    <>
    {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
    
    <div className="animate-slide-in-up pb-12 pt-8">
      {/* Shared Header (Landing Page Style) */}
      <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-800">
              Paylaşılan Liste
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
              {sharedList.name}
          </h1>
          <p className="text-neutral-500 max-w-lg mx-auto text-lg">
             Bu listede <strong>{movies.length}</strong> harika yapım seni bekliyor.
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
               <button 
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
               >
                   Anasayfa
               </button>
               {!user && (
                   <button 
                        onClick={openAuthModal}
                        className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30"
                   >
                       Kendi Listeni Oluştur
                   </button>
               )}
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {movies.map((movie) => (
            <MovieCard 
                key={movie.id}
                movie={movie} 
                // Only show filled heart if user is logged in and has it
                isSelected={user ? checkIsSelected(movie.id) : false}
                // Allow adding to own collection even from shared view
                onToggleSelect={handleToggleSelect} 
                onClick={onSelectMovie} 
                allGenres={genres}
            />
        ))}
      </div>
      
      {movies.length === 0 && (
          <div className="text-center text-neutral-500 py-20 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              <p className="font-medium">Bu liste henüz boş görünüyor.</p>
          </div>
      )}

      {/* Footer Branding for Shared View */}
      <div className="mt-20 pt-10 border-t border-neutral-200 dark:border-neutral-800 text-center">
           <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Tria.</h3>
           <p className="text-xs text-neutral-400">Sinematik Keşif ve Koleksiyon</p>
      </div>
    </div>
    </>
  );
};

export default SharedListView;