export interface MovieSummary {
  readonly id: number;
  readonly title: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly releaseYear: string | null;
  readonly releaseDate: string | null;
  readonly voteAverage: number | null;
  readonly genreIds: readonly number[];
  readonly genreNames: readonly string[];
}

export interface GenreRef {
  readonly id: number;
  readonly name: string;
}

export interface MovieDetails {
  readonly id: number;
  readonly title: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly releaseYear: string | null;
  readonly releaseDate: string | null;
  readonly voteAverage: number | null;
  readonly runtime: number | null;
  readonly genres: readonly GenreRef[];
  readonly tagline: string | null;
  readonly originalLanguage: string | null;
  readonly status: string | null;
}

export interface MoviePage {
  readonly movies: readonly MovieSummary[];
  readonly totalResults: number;
  readonly page: number;
  readonly totalPages: number;
}

export const EMPTY_MOVIE_PAGE: MoviePage = {
  movies: [],
  totalResults: 0,
  page: 1,
  totalPages: 0,
};

export interface CastMember {
  readonly id: number;
  readonly name: string;
  readonly character: string;
  readonly profilePath: string | null;
}

export interface CrewCredit {
  readonly id: number;
  readonly name: string;
  readonly job: string;
  readonly profilePath: string | null;
}

export interface MovieCredits {
  readonly cast: readonly CastMember[];
  readonly director: CrewCredit | null;
  readonly writers: readonly CrewCredit[];
}

export interface MovieTrailer {
  readonly key: string;
  readonly name: string;
}

export type GenreSort = 'popular' | 'latest' | 'top-rated';

export const EMPTY_CREDITS: MovieCredits = {
  cast: [],
  director: null,
  writers: [],
};

/** Wishlist and hero actions share one summary shape, including films opened from details. */
export function summaryFromDetails(movie: MovieDetails): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    releaseYear: movie.releaseYear,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    genreIds: movie.genres.map((genre) => genre.id),
    genreNames: movie.genres.map((genre) => genre.name),
  };
}
