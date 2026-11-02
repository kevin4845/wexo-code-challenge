import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type MovieSummary } from '../models/movie';
import { Auth } from './auth';
import { Wishlist } from './wishlist';

const heat: MovieSummary = {
  id: 42,
  title: 'Heat',
  overview: 'A detective and a thief.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseYear: '1995',
  releaseDate: '1995-12-15',
  voteAverage: 8.3,
  genreIds: [80],
  genreNames: ['Crime'],
};

const heatPayload = {
  id: 42,
  title: 'Heat',
  overview: 'A detective and a thief.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1995-12-15',
  vote_average: 8.3,
  vote_count: 20,
  genre_ids: [80],
};

describe('Wishlist', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('adds a film and then removes it without writing localStorage', () => {
    const { wishlist, http } = setup();
    http.expectOne('/api/wishlist').flush({ ids: [], movies: [] });

    wishlist.toggle(heat);
    const saved = http.expectOne('/api/wishlist');
    expect(saved.request.method).toBe('POST');
    expect(saved.request.body).toEqual({ tmdb_movie_id: 42 });
    expect(wishlist.isSaved(heat.id)).toBe(true);
    saved.flush(heatPayload);

    wishlist.toggle(heat);
    const removed = http.expectOne('/api/wishlist/42');
    expect(removed.request.method).toBe('DELETE');
    expect(wishlist.isSaved(heat.id)).toBe(false);
    removed.flush(null);

    expect(localStorage.getItem('frame.wishlist')).toBeNull();
    http.verify();
  });

  it('loads the account wishlist from the API', () => {
    const { wishlist, http } = setup();

    http.expectOne('/api/wishlist').flush({ ids: [42], movies: [heatPayload] });

    expect(wishlist.items()).toEqual([{ ...heat, genreNames: [] }]);
    expect(wishlist.isSaved(42)).toBe(true);
    http.verify();
  });

  it('copies a browser wishlist into the account and then clears it', () => {
    localStorage.setItem('frame.wishlist', JSON.stringify([heat]));
    const { http } = setup();

    http.expectOne('/api/wishlist').flush({ ids: [], movies: [] });
    const saved = http.expectOne('/api/wishlist');
    expect(saved.request.method).toBe('POST');
    expect(saved.request.body).toEqual({ tmdb_movie_id: 42 });
    saved.flush(heatPayload);
    http.expectOne('/api/wishlist').flush({ ids: [42], movies: [heatPayload] });

    expect(localStorage.getItem('frame.wishlist')).toBeNull();
    http.verify();
  });
});

function setup(): { wishlist: Wishlist; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const http = TestBed.inject(HttpTestingController);
  const auth = TestBed.inject(Auth);
  const wishlist = TestBed.inject(Wishlist);

  auth.checkAuthentication().subscribe();
  http.expectOne('/api/user').flush({ id: 1, name: 'Ada', email: 'ada@example.com' });
  TestBed.flushEffects();

  return { wishlist, http };
}
