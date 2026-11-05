import { parseMovie, parseMoviePage, parseTrailer, parseWatchProviders } from './tmdb-map';

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

  it('accepts a trailer key that can be embedded', () => {
    expect(parseTrailer({ key: 'newtrailerxx', name: 'Official trailer' })).toEqual({
      key: 'newtrailerxx',
      name: 'Official trailer',
    });
    expect(parseTrailer({ key: null, name: null })).toBeNull();
    expect(parseTrailer({ key: 'https://evil.example/embed', name: 'Bad' })).toBeNull();
  });

  it('keeps Denmark watch providers and drops a link that is not the TMDB page', () => {
    const offer = parseWatchProviders({
      link: 'https://example.com/watch',
      flatrate: [
        {
          provider_id: 2,
          provider_name: 'Apple TV',
          logo_path: '/apple.jpg',
          display_priority: 2,
        },
        {
          provider_id: 8,
          provider_name: 'Netflix',
          logo_path: 'https://evil.example/logo.jpg',
          display_priority: 0,
        },
        { provider_id: 8, provider_name: 'Netflix again', display_priority: 1 },
      ],
      rent: [{ provider_id: 3 }],
      buy: [],
    });

    expect(offer.link).toBeNull();
    expect(offer.flatrate.map((provider) => provider.name)).toEqual(['Netflix', 'Apple TV']);
    expect(offer.flatrate[0]?.logoPath).toBeNull();
    expect(offer.rent).toEqual([]);
    expect(offer.buy).toEqual([]);
  });
});
