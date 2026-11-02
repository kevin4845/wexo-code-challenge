import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((feature) => feature.Home),
  },
  {
    path: 'genres',
    loadComponent: () => import('./features/genres/genres').then((feature) => feature.Genres),
  },
  {
    path: 'genres/:genreId',
    loadComponent: () =>
      import('./features/genres/genre-detail').then((feature) => feature.GenreDetail),
  },
  {
    path: 'movies/:id',
    loadComponent: () =>
      import('./features/movies/movie-detail').then((feature) => feature.MovieDetail),
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./features/wishlist/wishlist').then((feature) => feature.WishlistPage),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search-page').then((feature) => feature.SearchPage),
  },
  { path: '**', redirectTo: '' },
];
