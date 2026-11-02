/**
 * Build-time application settings.
 *
 * Credentials stored in an Angular frontend are publicly accessible in the
 * compiled JavaScript bundle. That is acceptable for this test project only.
 * The recommended production solution is to keep credentials in backend
 * environment variables or Cloudflare secrets and proxy API requests through
 * a backend.
 *
 * Do not commit real credentials. Paste them into the local environment file
 * and leave the committed files on the placeholder values.
 */
export interface AppEnvironment {
  readonly production: boolean;
  readonly tmdb: {
    readonly baseUrl: string;
    readonly imageBaseUrl: string;
    readonly accessToken: string;
    readonly apiKey: string;
  };
}
