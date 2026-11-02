import type { GenreSort } from './movie';

/**
 * Genres FRAME browses on the homepage. Ids are TMDB's movie genre ids.
 * Descriptions are editorial labels, not data returned by the API.
 */
export interface CatalogGenre {
  readonly id: number;
  readonly name: string;
  readonly description: string;
}

export const CATALOG_GENRES: readonly CatalogGenre[] = [
  {
    id: 28,
    name: 'Action',
    description: 'High-octane set pieces and stories told at full speed.',
  },
  {
    id: 35,
    name: 'Comedy',
    description: 'Wit, warmth and trouble worth laughing through.',
  },
  {
    id: 53,
    name: 'Thriller',
    description: 'Tension, pursuit and secrets that refuse to stay buried.',
  },
  {
    id: 10752,
    name: 'War',
    description: 'Conflict, courage and the cost of the battlefield.',
  },
  {
    id: 10749,
    name: 'Romance',
    description: 'Connection, longing and the choices love asks for.',
  },
  {
    id: 18,
    name: 'Drama',
    description: 'Character, consequence and stories that stay with you.',
  },
  {
    id: 80,
    name: 'Crime',
    description: 'Heists, investigators and lives lived outside the law.',
  },
  {
    id: 99,
    name: 'Documentary',
    description: 'Real events, told with a filmmaker’s eye.',
  },
  {
    id: 27,
    name: 'Horror',
    description: 'Dread, darkness and the things waiting in it.',
  },
];

export function catalogGenre(id: number): CatalogGenre | null {
  return CATALOG_GENRES.find((genre) => genre.id === id) ?? null;
}

export function normalizeSort(value: string | undefined): GenreSort {
  if (value === 'latest' || value === 'top-rated') {
    return value;
  }
  return 'popular';
}
