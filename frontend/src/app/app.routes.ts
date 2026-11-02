import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((feature) => feature.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then((feature) => feature.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
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
    ],
  },
  { path: '**', redirectTo: '' },
];
