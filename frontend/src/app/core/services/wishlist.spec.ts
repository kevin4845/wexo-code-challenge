import { TestBed } from '@angular/core/testing';

import { type MovieSummary } from '../models/movie';
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

describe('Wishlist', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('adds a film and then removes it', () => {
    TestBed.configureTestingModule({});
    const wishlist = TestBed.inject(Wishlist);

    wishlist.toggle(heat);
    expect(wishlist.isSaved(heat.id)).toBe(true);
    expect(wishlist.count()).toBe(1);

    wishlist.toggle(heat);
    expect(wishlist.isSaved(heat.id)).toBe(false);
    expect(JSON.parse(localStorage.getItem('frame.wishlist') ?? '[]')).toEqual([]);
  });

  it('restores a previously saved film', () => {
    localStorage.setItem('frame.wishlist', JSON.stringify([heat]));
    TestBed.configureTestingModule({});
    const wishlist = TestBed.inject(Wishlist);

    expect(wishlist.items()).toEqual([heat]);
  });

  it('ignores corrupt storage', () => {
    localStorage.setItem('frame.wishlist', '{not json');
    TestBed.configureTestingModule({});
    const wishlist = TestBed.inject(Wishlist);

    expect(wishlist.items()).toEqual([]);
  });
});
