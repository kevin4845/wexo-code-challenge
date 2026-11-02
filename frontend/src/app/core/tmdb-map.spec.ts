import { parseMovie, parseMoviePage, parseTrailer } from './tmdb-map';

describe('tmdb response mapping', () => {
  it('drops films that have no title and treats an unrated score as missing', () => {
    const page = parseMoviePage({
      page: 1,
      total_results: 2,
      total_pages: 1,
      results: [
        {
          id: 1,
          title: 'Heat',
          overview: 'A detective and a thief.',
          poster_path: '/poster.jpg',
          backdrop_path: null,
          release_date: '1995-12-15',
          vote_average: 0,
          vote_count: 0,
          genre_ids: [80, 18],
        },
        { id: 2, overview: 'Missing title' },
      ],
    });

    expect(page.movies).toHaveLength(1);
    expect(page.movies[0]).toMatchObject({
      title: 'Heat',
      releaseYear: '1995',
      voteAverage: null,
      posterPath: '/poster.jpg',
      backdropPath: null,
    });
  });

  it('returns null for a payload that is not a film', () => {
    expect(parseMovie(null)).toBeNull();
    expect(parseMovie({ title: 'No id' })).toBeNull();
  });

  it('prefers an official YouTube trailer', () => {
    const trailer = parseTrailer({
      results: [
        { site: 'YouTube', type: 'Teaser', key: 'teaser', official: true },
        {
          site: 'YouTube',
          type: 'Trailer',
          key: 'trailer',
          official: true,
          name: 'Official trailer',
        },
        { site: 'Vimeo', type: 'Trailer', key: 'ignored', official: true },
      ],
    });

    expect(trailer).toEqual({ key: 'trailer', name: 'Official trailer' });
  });
});
