import { environment } from '../../environments/environment';

export type TmdbImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'w1280';

/** Builds a TMDB image URL. Returns null when the API omitted the file or the base URL is unset. */
export function tmdbImageUrl(path: string | null, size: TmdbImageSize): string | null {
  if (!path || !environment.tmdb.imageBaseUrl) {
    return null;
  }

  const base = environment.tmdb.imageBaseUrl.replace(/\/$/, '');
  const file = path.startsWith('/') ? path : `/${path}`;
  return `${base}/${size}${file}`;
}
