/**
 * Build-time application settings.
 *
 * TMDB credentials stay on the Laravel server. This frontend only receives
 * the address of that API and the public TMDB image host.
 */
export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly imageBaseUrl: string;
}
