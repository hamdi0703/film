import { TmdbResponse, GenreResponse, SortOption, Movie, MediaType } from '../types';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
const BASE_URL = 'https://api.themoviedb.org/3';

// SYSTEM CONFIGURATION
const SYSTEM_API_KEY = '84fedfba42a08ab1365b8261d7ff276d';

// GLOBAL STATIC CACHE
const REQUEST_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache

export class TmdbService {
  
  constructor() {
    // Constructor logic if needed
  }

  // Helper: Sleep function
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchFromApi<T>(endpoint: string, params: Record<string, string> = {}, retries = 3, backoff = 1000): Promise<T> {
    const queryParams = new URLSearchParams({
      api_key: SYSTEM_API_KEY,
      language: 'tr-TR',
      include_adult: 'false',
      ...params,
    });

    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;

    // 1. CHECK CACHE
    const cacheKey = url;
    const cached = REQUEST_CACHE.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.data as T;
    }

    try {
      const response = await fetch(url);

      // Handle Rate Limiting (429)
      if (response.status === 429) {
        if (retries > 0) {
          console.warn(`TMDB Rate Limit Hit. Retrying in ${backoff}ms... (${retries} attempts left)`);
          await this.delay(backoff);
          return this.fetchFromApi<T>(endpoint, params, retries - 1, backoff * 2);
        } else {
          throw new Error("API Rate Limit Exceeded. Please try again later.");
        }
      }

      if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 2. SAVE TO CACHE
      // Don't cache search queries or specific movie details as heavily, but generalized lists are safe
      if (!endpoint.includes('/search')) {
          REQUEST_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;

    } catch (error: any) {
        if (error.message === 'Failed to fetch' && retries > 0) {
             console.warn(`Network error. Retrying... (${retries} left)`);
             await this.delay(backoff);
             return this.fetchFromApi<T>(endpoint, params, retries - 1, backoff * 2);
        }
        throw error;
    }
  }

  async getTrending(page: number = 1): Promise<TmdbResponse> {
    return this.fetchFromApi<TmdbResponse>('/trending/movie/week', { page: page.toString() });
  }

  async searchMovies(query: string, page: number = 1, type: MediaType = 'movie', year?: number): Promise<TmdbResponse> {
    const params: Record<string, string> = {
      query: query,
      page: page.toString()
    };

    if (year) {
      if (type === 'movie') {
        params['primary_release_year'] = year.toString();
      } else {
        params['first_air_date_year'] = year.toString();
      }
    }

    // Search endpoints are typically not cached aggressively in the method above to ensure freshness
    return this.fetchFromApi<TmdbResponse>(`/search/${type}`, params);
  }

  async getGenres(type: MediaType = 'movie'): Promise<GenreResponse> {
    return this.fetchFromApi<GenreResponse>(`/genre/${type}/list`);
  }

  async discoverMovies(
    page: number = 1, 
    sortBy: SortOption = 'popularity.desc', 
    genreId?: number,
    year?: number,
    type: MediaType = 'movie'
  ): Promise<TmdbResponse> {
    const params: Record<string, string> = {
      page: page.toString(),
      sort_by: sortBy,
      'vote_count.gte': '100', 
    };

    if (genreId) {
      params['with_genres'] = genreId.toString();
    }

    if (year) {
      if (type === 'movie') {
        params['primary_release_year'] = year.toString();
      } else {
        params['first_air_date_year'] = year.toString();
      }
    }

    return this.fetchFromApi<TmdbResponse>(`/discover/${type}`, params);
  }

  async getClassics(): Promise<TmdbResponse> {
    return this.fetchFromApi<TmdbResponse>('/discover/movie', {
      sort_by: 'vote_average.desc',
      'vote_count.gte': '1000',
      'primary_release_date.lte': '2000-01-01',
      page: '1'
    });
  }

  async getMovieDetail(id: number, type: MediaType = 'movie'): Promise<Movie> {
    return this.fetchFromApi<Movie>(`/${type}/${id}`, {
      append_to_response: 'credits'
    });
  }
}