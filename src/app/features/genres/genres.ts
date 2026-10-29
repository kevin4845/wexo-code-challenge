import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';

import { CATALOG_GENRES } from '../../core/models/catalog';
import { type MoviePage } from '../../core/models/movie';
import { Tmdb } from '../../core/services/tmdb';
import { tmdbImageUrl } from '../../core/tmdb-image';
import { GenreCard } from '../../shared/components/genre-card/genre-card';
import { previewGenreArt, previewGenreCount } from '../../shared/preview/preview-catalog';

@Component({
  selector: 'app-genres',
  imports: [GenreCard],
  templateUrl: './genres.html',
  styleUrl: './genres.scss',
})
export class Genres {
  private readonly tmdb = inject(Tmdb);

  protected readonly genres = CATALOG_GENRES;
  protected readonly configured = this.tmdb.isConfigured();
  protected readonly rows = CATALOG_GENRES.map((genre) => ({
    genre,
    catalog: rxResource({
      stream: () => this.tmdb.moviesByGenre(genre.id),
    }),
  }));

  constructor() {
    inject(Title).setTitle('Genres · FRAME');
  }

  protected genreImage(genreId: number, page: MoviePage | undefined): string | null {
    if (this.configured) {
      const movie = page?.movies.find((item) => item.backdropPath || item.posterPath);
      if (movie) {
        return tmdbImageUrl(movie.backdropPath ?? movie.posterPath, 'w780');
      }
    }
    return previewGenreArt(genreId);
  }

  protected rowCount(genreId: number, page: MoviePage | undefined): number | null {
    if (this.configured) {
      return page ? page.totalResults : null;
    }
    return previewGenreCount(genreId);
  }
}
