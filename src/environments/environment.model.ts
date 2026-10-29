/**
 * Build-time application settings.
 *
 * `apiKey` stays empty in committed files. Real credentials belong in a
 * gitignored `src/environments/*.local.ts` file and must not be committed.
 * The base URLs are TMDB's public hosts, not secrets.
 */
export interface AppEnvironment {
  readonly production: boolean;
  readonly tmdb: {
    readonly apiKey: string;
    readonly apiBaseUrl: string;
    readonly imageBaseUrl: string;
  };
}
