import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserReview } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

const STORAGE_KEY = 'tria_user_reviews';

interface ReviewContextType {
  reviews: Record<number, UserReview>;
  addReview: (review: UserReview) => Promise<void>;
  removeReview: (movieId: number) => Promise<void>;
  getReview: (movieId: number) => UserReview | undefined;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Record<number, UserReview>>({});
  const { user } = useAuth();

  // Load reviews: Hybrid Strategy (Supabase if logged in, LocalStorage if not)
  useEffect(() => {
    const loadFromLocal = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setReviews(JSON.parse(stored));
        } else {
          setReviews({});
        }
      } catch (error) {
        console.error("Failed to load local reviews", error);
      }
    };

    const loadReviews = async () => {
      if (user) {
        // Check if it is a mock user (Admin)
        if (user.id.startsWith('mock-')) {
            loadFromLocal();
            return;
        }

        // Authenticated Load
        try {
          const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', user.id);
          
          if (error) throw error;
          
          if (data) {
            const mapped: Record<number, UserReview> = {};
            data.forEach((r: any) => {
              mapped[r.movie_id] = {
                movieId: r.movie_id,
                rating: r.rating,
                comment: r.comment,
                hasSpoiler: r.has_spoiler,
                createdAt: r.created_at
              };
            });
            setReviews(mapped);
          }
        } catch (err) {
          console.warn('Supabase sync failed, check connection.');
        }
      } else {
        // Guest Load
        loadFromLocal();
      }
    };

    loadReviews();
  }, [user]);

  // Sync to LocalStorage (Backup for offline capability or Guest mode)
  useEffect(() => {
    if (!user || user.id.startsWith('mock-')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    }
  }, [reviews, user]);

  const addReview = useCallback(async (review: UserReview) => {
    // 1. Optimistic Update (Immediate UI feedback)
    setReviews(prev => ({
      ...prev,
      [review.movieId]: review
    }));

    // 2. Persist to Supabase if logged in (and not mock user)
    if (user && !user.id.startsWith('mock-')) {
        try {
            // Using UPSERT is cleaner and atomic (Handle Insert or Update in one go)
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    user_id: user.id,
                    movie_id: review.movieId,
                    rating: review.rating,
                    comment: review.comment,
                    has_spoiler: review.hasSpoiler ?? false,
                    // created_at is automatic on insert
                }, { onConflict: 'user_id,movie_id' }); // Ensure unique constraint matches without spaces if sensitive

            if (error) {
                // Throw error to be caught by catch block
                throw error;
            }
        } catch (e: any) {
            console.error("Cloud save failed:", e.message || e);
            // Re-throw so UI knows it failed (optional, but good practice)
            throw e;
        }
    }
  }, [user]);

  const removeReview = useCallback(async (movieId: number) => {
    // 1. Optimistic Update
    setReviews(prev => {
      const newState = { ...prev };
      delete newState[movieId];
      return newState;
    });

    // 2. Persist deletion to Supabase
    if (user && !user.id.startsWith('mock-')) {
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('user_id', user.id)
                .eq('movie_id', movieId);
            
            if (error) throw error;
        } catch (e: any) {
            console.error("Cloud delete failed:", e.message || e);
        }
    }
  }, [user]);

  const getReview = useCallback((movieId: number) => {
    return reviews[movieId];
  }, [reviews]);

  return (
    <ReviewContext.Provider value={{ reviews, addReview, removeReview, getReview }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviewContext = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReviewContext must be used within a ReviewProvider');
  }
  return context;
};