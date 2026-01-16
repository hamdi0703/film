import { useReviewContext } from '../context/ReviewContext';

export const useReviews = (movieId: number) => {
  const { getReview, addReview, removeReview } = useReviewContext();

  const review = getReview(movieId) || null;

  const saveReview = (rating: number, comment: string, hasSpoiler: boolean = false) => {
    try {
      addReview({
        movieId,
        rating,
        comment,
        hasSpoiler,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Failed to save review", error);
      return false;
    }
  };

  const deleteReview = () => {
    removeReview(movieId);
  };

  return { review, saveReview, deleteReview };
};