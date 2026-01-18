
export type MediaType = 'movie' | 'tv';

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Creator {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

export interface Country {
  iso_3166_1: string;
  name: string;
}

export interface Movie {
  id: number;
  title?: string;
  name?: string; // For TV series
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string; // For Movies
  first_air_date?: string; // For TV Series
  last_air_date?: string; // For TV Series
  genre_ids?: number[];
  genres?: Genre[];
  overview?: string;
  tagline?: string;
  runtime?: number; // Movie duration
  episode_run_time?: number[]; // TV duration array
  number_of_seasons?: number; // TV
  number_of_episodes?: number; // TV
  status?: string; // "Returning Series", "Ended", etc.
  created_by?: Creator[]; // TV Creators
  credits?: Credits;
  production_countries?: Country[];
  addedAt?: string; // ISO Date String for "Date Added" sorting
}

export interface TmdbResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenreResponse {
  genres: Genre[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string; // New: Liste açıklaması
  isPublic?: boolean;   // New: Paylaşım durumu
  shareToken?: string;  // New: Benzersiz paylaşım linki
  movies: Movie[];
  topFavoriteMovies?: (number | null)[]; // 5 slots
  topFavoriteShows?: (number | null)[];  // 5 slots
  owner?: string; // Username of the sharer
  ownerId?: string; // ID of the sharer (for edit permission logic)
}

export type SortOption = 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'revenue.desc';

export interface FilterState {
  genreId: number | null;
  year: number | null;
  sortBy: SortOption;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface UserReview {
  movieId: number;
  rating: number; // 1-10
  comment: string;
  hasSpoiler?: boolean;
  createdAt: string; // ISO Date String
}
