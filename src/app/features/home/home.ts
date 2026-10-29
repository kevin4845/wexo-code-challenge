import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { CATALOG_GENRES } from '../../core/models/catalog';
import { type MoviePage, type MovieSummary } from '../../core/models/movie';
import { formatVote } from '../../core/format';
import { catalogueErrorCopy } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { Wishlist } from '../../core/services/wishlist';
import { tmdbImageUrl } from '../../core/tmdb-image';
import { GenreCard } from '../../shared/components/genre-card/genre-card';
import { Icon } from '../../shared/components/icon/icon';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import {
  displayImage,
  PREVIEW_FEATURED,
  previewGenreArt,
  previewGenreCount,
  previewMoviesForGenre,
} from '../../shared/preview/preview-catalog';

@Component({
  selector: 'app-home',
  imports: [RouterLink, GenreCard, MovieCard, Icon],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly tmdb = inject(Tmdb);
  private readonly wishlist = inject(Wishlist);

  protected readonly configured = this.tmdb.isConfigured();
  protected readonly errorCopy = catalogueErrorCopy;
  protected readonly formatVote = formatVote;
  protected readonly imageUrl = displayImage;

  protected readonly featured = rxResource({
    stream: () => this.tmdb.featured(),
  });

  /** One discover request feeds both the genre tile and that genre's poster row. */
  protected readonly rows = CATALOG_GENRES.map((genre) => ({
    genre,
    catalog: rxResource({
      stream: () => this.tmdb.moviesByGenre(genre.id),
    }),
  }));

  constructor() {
    inject(Title).setTitle('FRAME');
  }

  /** Live rows when TMDB answered. Otherwise the static poster preview for that genre. */
  protected rowMovies(genreId: number, page: MoviePage | undefined): readonly MovieSummary[] {
    if (this.configured && page && page.movies.length > 0) {
      return page.movies.slice(0, 8);
    }
    if (this.configured) {
      return [];
    }
    return previewMoviesForGenre(genreId);
  }

  protected heroFilm(): MovieSummary | null {
    if (!this.configured) {
      return PREVIEW_FEATURED;
    }
    return this.featured.hasValue() ? this.featured.value() : null;
  }

  protected genreImage(page: MoviePage | undefined): string | null {
    const movie = page?.movies.find((item) => item.backdropPath || item.posterPath);
    if (!movie) {
      return null;
    }
    return tmdbImageUrl(movie.backdropPath ?? movie.posterPath, 'w780');
  }

  protected rowImage(genreId: number, page: MoviePage | undefined): string | null {
    const live = this.configured ? this.genreImage(page) : null;
    return live ?? previewGenreArt(genreId);
  }

  protected rowCount(genreId: number, page: MoviePage | undefined): number | null {
    if (this.configured) {
      return page ? page.totalResults : null;
    }
    return previewGenreCount(genreId);
  }

  protected toggleFeatured(movie: MovieSummary): void {
    this.wishlist.toggle(movie);
  }

  protected isSaved(id: number): boolean {
    return this.wishlist.isSaved(id);
  }
}
