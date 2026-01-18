import React, { useState, useEffect } from 'react';
import { useReviews } from '../../hooks/useReviews';
import { useToast } from '../../context/ToastContext';

interface ReviewSectionProps {
  movieId: number;
  movieTitle: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ movieId, movieTitle }) => {
  const { review, saveReview, deleteReview } = useReviews(movieId);
  const { showToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Viewer state
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  // Sync state when review loads
  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment);
      setHasSpoiler(review.hasSpoiler || false);
      setIsEditing(false);
      setIsSpoilerRevealed(false); // Reset reveal state on load
    } else {
      setRating(0);
      setComment('');
      setHasSpoiler(false);
      setIsEditing(true);
    }
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        showToast('Lütfen bir puan verin', 'error');
        return;
    }

    setIsSaving(true);
    const success = await saveReview(rating, comment, hasSpoiler);
    setIsSaving(false);

    if (success) {
        showToast('İncelemeniz kaydedildi', 'success');
        setIsEditing(false);
    } else {
        showToast('Kaydedilirken bir sorun oluştu.', 'error');
    }
  };

  const handleDelete = async () => {
      if(window.confirm('Bu incelemeyi silmek istediğinize emin misiniz?')) {
          await deleteReview();
          setRating(0);
          setComment('');
          setHasSpoiler(false);
          setIsEditing(true);
          showToast('İnceleme silindi', 'info');
      }
  };

  // --- Render Helpers ---

  // Interactive Star Rater
  const renderStars = () => {
    return (
        <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`${star} Yıldız Ver`}
                    className={`transition-all duration-200 hover:scale-125 ${
                        star <= rating 
                        ? 'text-yellow-400' 
                        : 'text-neutral-300 dark:text-neutral-700'
                    }`}
                >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                </button>
            ))}
            <span className="ml-3 text-lg font-bold text-neutral-900 dark:text-white w-8">
                {rating > 0 ? rating : '-'}
            </span>
        </div>
    );
  };

  if (!isEditing && review) {
      // --- DISPLAY MODE ---
      const showContent = !review.hasSpoiler || isSpoilerRevealed;

      return (
        <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest">Kişisel Notlarınız</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                    >
                        Düzenle
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                        Sil
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                {/* Decorative Quote Icon */}
                <div className="absolute top-4 right-4 opacity-10">
                    <svg className="w-16 h-16 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                    </svg>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                            {review.rating}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-500">Puanınız</span>
                            <span className="text-xs text-neutral-400">
                                {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        {review.hasSpoiler && (
                            <div className="ml-auto px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-full border border-red-200 dark:border-red-900/50">
                                Spoiler
                            </div>
                        )}
                    </div>
                    
                    <div className="relative group">
                        <p className={`text-neutral-800 dark:text-neutral-200 italic leading-relaxed text-lg transition-all duration-500 ${!showContent ? 'blur-md select-none' : ''}`}>
                            "{review.comment}"
                        </p>
                        
                        {/* Spoiler Curtain */}
                        {!showContent && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <button 
                                    onClick={() => setIsSpoilerRevealed(true)}
                                    className="flex flex-col items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-6 py-3 rounded-xl backdrop-blur-sm transition-all transform hover:scale-105 shadow-xl border border-white/10"
                                >
                                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    <span className="text-sm font-bold">Spoiler İçerir</span>
                                    <span className="text-[10px] opacity-70">Görmek için tıkla</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- EDIT MODE ---
  return (
    <div className="mb-12 animate-slide-in-up">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest mb-4">
            {review ? 'İncelemeyi Düzenle' : 'Kişisel Not Ekle'}
        </h3>
        
        <form onSubmit={handleSubmit} className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="mb-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Puanınız</label>
                {renderStars()}
            </div>

            <div className="mb-4">
                 <label htmlFor="review-comment" className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Düşünceleriniz</label>
                 <textarea 
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bu film hakkında ne düşünüyorsunuz? Unutulmaz sahneler, oyunculuklar..."
                    className="w-full h-32 px-4 py-3 rounded-xl bg-white dark:bg-black text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                 />
            </div>

            <div className="flex items-center justify-between mb-6">
                 {/* Spoiler Toggle */}
                 <button
                    type="button"
                    onClick={() => setHasSpoiler(!hasSpoiler)}
                    aria-label={hasSpoiler ? 'Spoiler işaretini kaldır' : 'Spoiler olarak işaretle'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                        hasSpoiler 
                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' 
                        : 'bg-white dark:bg-black text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                 >
                    {hasSpoiler ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    )}
                    Spoiler İçerir
                 </button>
            </div>

            <div className="flex justify-end gap-3">
                {review && (
                    <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 rounded-xl font-bold text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                        İptal
                    </button>
                )}
                <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ReviewSection;