import { type CastMember, type MovieDetails, type MovieSummary } from '../../core/models/movie';
import { tmdbImageUrl, type TmdbImageSize } from '../../core/tmdb-image';

/**
 * Static artwork for the design preview.
 * These titles are not catalogue data. Live TMDB results replace them when a request succeeds.
 */
const art = '/assets/preview';

const cast: readonly CastMember[] = [
  { id: 1, name: 'Mara Ellison', character: 'Lena Voss', profilePath: `${art}/cast-01.jpg` },
  { id: 2, name: 'Adrian Cole', character: 'Inspector Rahim', profilePath: `${art}/cast-02.jpg` },
  { id: 3, name: 'Elias Ward', character: 'Captain Havel', profilePath: `${art}/cast-03.jpg` },
  { id: 4, name: 'Ione Park', character: 'June Adeyemi', profilePath: `${art}/cast-04.jpg` },
];

interface PreviewRecord {
  readonly summary: MovieSummary;
  readonly details: MovieDetails;
}

function preview(input: {
  id: number;
  title: string;
  year: string;
  vote: number;
  runtime: number;
  poster: string;
  backdrop: string;
  genres: readonly { id: number; name: string }[];
  overview: string;
  tagline: string;
}): PreviewRecord {
  const summary: MovieSummary = {
    id: input.id,
    title: input.title,
    overview: input.overview,
    posterPath: `${art}/${input.poster}`,
    backdropPath: `${art}/${input.backdrop}`,
    releaseYear: input.year,
    releaseDate: null,
    voteAverage: input.vote,
    genreIds: input.genres.map((genre) => genre.id),
    genreNames: input.genres.map((genre) => genre.name),
  };

  return {
    summary,
    details: {
      ...summary,
      runtime: input.runtime,
      genres: input.genres,
      tagline: input.tagline,
      originalLanguage: 'en',
      status: 'Released',
    },
  };
}

const records: readonly PreviewRecord[] = [
  preview({
    id: 9101,
    title: 'Night Meridian',
    year: '2024',
    vote: 8.2,
    runtime: 128,
    poster: 'poster-meridian.jpg',
    backdrop: 'hero-night.jpg',
    genres: [
      { id: 28, name: 'Action' },
      { id: 53, name: 'Thriller' },
    ],
    tagline: 'The city keeps the hour she lost.',
    overview:
      'A courier walks back into a city that already buried her name, following one message through rain, rival crews and a night that refuses to end.',
  }),
  preview({
    id: 9102,
    title: 'Red Kilometer',
    year: '2023',
    vote: 7.6,
    runtime: 116,
    poster: 'poster-kilometer.jpg',
    backdrop: 'genre-action.jpg',
    genres: [
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ],
    tagline: 'Every mile has a witness.',
    overview:
      'Two drivers trade a stolen route across an empty desert, learning too late that the cargo was never the point.',
  }),
  preview({
    id: 9103,
    title: 'Low Orbit',
    year: '2022',
    vote: 7.4,
    runtime: 121,
    poster: 'poster-orbit.jpg',
    backdrop: 'genre-action.jpg',
    genres: [{ id: 28, name: 'Action' }],
    tagline: 'The ground is a rumor.',
    overview:
      'A grounded pilot is pulled into one last night flight, with a hangar full of people who need the dawn more than she does.',
  }),
  preview({
    id: 9104,
    title: 'Second Encore',
    year: '2021',
    vote: 7.8,
    runtime: 104,
    poster: 'poster-encore.jpg',
    backdrop: 'genre-comedy.jpg',
    genres: [
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
    ],
    tagline: 'One more song, then the truth.',
    overview:
      'A house band agrees to a farewell show and spends the week discovering they were never as finished with each other as the poster claimed.',
  }),
  preview({
    id: 9105,
    title: 'Glass Harbor',
    year: '2020',
    vote: 8,
    runtime: 119,
    poster: 'poster-harbor.jpg',
    backdrop: 'genre-thriller.jpg',
    genres: [
      { id: 53, name: 'Thriller' },
      { id: 18, name: 'Drama' },
    ],
    tagline: 'The tide returns what it is owed.',
    overview:
      'A harbor town keeps a careful silence after a boat comes back light. One outsider starts asking which stories were agreed upon.',
  }),
  preview({
    id: 9106,
    title: 'Winter Signal',
    year: '2019',
    vote: 7.5,
    runtime: 112,
    poster: 'poster-signal.jpg',
    backdrop: 'genre-romance.jpg',
    genres: [
      { id: 10749, name: 'Romance' },
      { id: 53, name: 'Thriller' },
    ],
    tagline: 'She answers on the second ring.',
    overview:
      'A late train, a borrowed name and a conversation that was supposed to last one stop. The snow makes every delay feel deliberate.',
  }),
  preview({
    id: 9107,
    title: 'Last Carriage',
    year: '2018',
    vote: 8.4,
    runtime: 134,
    poster: 'poster-carriage.jpg',
    backdrop: 'genre-war.jpg',
    genres: [
      { id: 10752, name: 'War' },
      { id: 18, name: 'Drama' },
    ],
    tagline: 'Someone has to bring them home.',
    overview:
      'After the fighting moves on, a small crew is left to return what can still be returned. The work is slow, and nobody agrees when it is done.',
  }),
  preview({
    id: 9108,
    title: 'Violet Hour',
    year: '2024',
    vote: 7.7,
    runtime: 108,
    poster: 'poster-violet.jpg',
    backdrop: 'genre-romance.jpg',
    genres: [
      { id: 10749, name: 'Romance' },
      { id: 18, name: 'Drama' },
    ],
    tagline: 'Stay until the lights change.',
    overview:
      'Two people share a window, a bottle and a decision they have postponed for a year. The city below keeps its own appointments.',
  }),
  preview({
    id: 9109,
    title: 'North of Quiet',
    year: '2017',
    vote: 8.1,
    runtime: 126,
    poster: 'poster-quiet.jpg',
    backdrop: 'genre-drama.jpg',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 99, name: 'Documentary' },
    ],
    tagline: 'Listen longer than is comfortable.',
    overview:
      'A filmmaker returns to a northern town to finish a conversation her father left on a reel. The residents answer in their own time.',
  }),
  preview({
    id: 9110,
    title: 'Brass Key',
    year: '2016',
    vote: 7.9,
    runtime: 117,
    poster: 'poster-key.jpg',
    backdrop: 'genre-crime.jpg',
    genres: [
      { id: 80, name: 'Crime' },
      { id: 53, name: 'Thriller' },
    ],
    tagline: 'The lock was never the secret.',
    overview:
      'A locksmith is hired to open one apartment and finds the job has already been done, twice, by people who still have a reason to return.',
  }),
  preview({
    id: 9111,
    title: 'Paper Saints',
    year: '2015',
    vote: 7.3,
    runtime: 98,
    poster: 'poster-saints.jpg',
    backdrop: 'genre-documentary.jpg',
    genres: [{ id: 99, name: 'Documentary' }],
    tagline: 'The notes outlived the tour.',
    overview:
      'An archivist pieces together a vanished choir from notebooks, reels and the people who kept both in kitchen drawers.',
  }),
  preview({
    id: 9112,
    title: 'Salt Choir',
    year: '2023',
    vote: 7.2,
    runtime: 101,
    poster: 'poster-choir.jpg',
    backdrop: 'genre-horror.jpg',
    genres: [
      { id: 27, name: 'Horror' },
      { id: 53, name: 'Thriller' },
    ],
    tagline: 'The cliff keeps the harmony.',
    overview:
      'A coastal village hears singing when the fog sits low. A newcomer records it, then realizes the recording is answering back.',
  }),
];

const genreArt: Readonly<Record<number, string>> = {
  28: `${art}/genre-action.jpg`,
  35: `${art}/genre-comedy.jpg`,
  53: `${art}/genre-thriller.jpg`,
  10752: `${art}/genre-war.jpg`,
  10749: `${art}/genre-romance.jpg`,
  18: `${art}/genre-drama.jpg`,
  80: `${art}/genre-crime.jpg`,
  99: `${art}/genre-documentary.jpg`,
  27: `${art}/genre-horror.jpg`,
};

export const PREVIEW_FEATURED: MovieSummary = records[0].summary;

/** Local preview files stay as-is. TMDB paths still go through the image host. */
export function displayImage(path: string | null, size: TmdbImageSize = 'w342'): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith('/assets/')) {
    return path;
  }
  return tmdbImageUrl(path, size);
}

export function previewGenreArt(genreId: number): string | null {
  return genreArt[genreId] ?? null;
}

/** How many preview films are actually tagged with this genre. */
export function previewGenreCount(genreId: number): number {
  return records.filter((record) => record.summary.genreIds.includes(genreId)).length;
}

/** Up to six preview posters for a genre row or genre page. */
export function previewMoviesForGenre(genreId: number): readonly MovieSummary[] {
  const matching = records
    .filter((record) => record.summary.genreIds.includes(genreId))
    .map((record) => record.summary);
  if (matching.length >= 6) {
    return matching.slice(0, 6);
  }
  const rest = records
    .map((record) => record.summary)
    .filter((movie) => !matching.some((item) => item.id === movie.id));
  return [...matching, ...rest].slice(0, 6);
}

export function previewDetails(id: number): MovieDetails | null {
  return records.find((record) => record.summary.id === id)?.details ?? null;
}

export function previewCast(): readonly CastMember[] {
  return cast;
}

export function previewDirector(): string {
  return 'Helen Cho';
}

export function previewWriters(): string {
  return 'Helen Cho, Ione Park';
}

export function previewRelated(id: number): readonly MovieSummary[] {
  return records
    .map((record) => record.summary)
    .filter((movie) => movie.id !== id)
    .slice(0, 6);
}

export function previewShelf(): readonly MovieSummary[] {
  return records.slice(0, 3).map((record) => record.summary);
}

export function previewHighlights(): readonly MovieSummary[] {
  return records.slice(0, 6).map((record) => record.summary);
}
