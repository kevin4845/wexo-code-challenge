import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { CATALOG_GENRES } from '../../core/models/catalog';
import { type MoviePage, type MovieSummary } from '../../core/models/movie';
import { formatVote } from '../../core/format';
import { catalogueErrorCopy, tmdbConfigMessage } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { Wishlist } from '../../core/services/wishlist';
import { tmdbImageUrl } from '../../core/tmdb-image';
import { armFilmFrame } from '../../shared/motion/film-transition';
import { GenreCard } from '../../shared/components/genre-card/genre-card';
import { Icon } from '../../shared/components/icon/icon';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { displayImage } from '../../shared/preview/preview-catalog';

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
  protected readonly configMessage = tmdbConfigMessage;
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

  /** First page of films TMDB returned for this genre. */
  protected rowMovies(page: MoviePage | undefined): readonly MovieSummary[] {
    return page?.movies.slice(0, 8) ?? [];
  }

  protected heroFilm(): MovieSummary | null {
    return this.featured.hasValue() ? this.featured.value() : null;
  }

  protected genreImage(page: MoviePage | undefined): string | null {
    const movie = page?.movies.find((item) => item.backdropPath || item.posterPath);
    if (!movie) {
      return null;
    }
    return tmdbImageUrl(movie.backdropPath ?? movie.posterPath, 'w780');
  }

  protected rowCount(page: MoviePage | undefined): number | null {
    return page ? page.totalResults : null;
  }

  protected toggleFeatured(movie: MovieSummary): void {
    this.wishlist.toggle(movie);
  }

  /** Name the still only for Explore movie, before the router snapshots the page. */
  protected armStill(event: Event, id: number): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter') {
      return;
    }
    const hero = (event.currentTarget as HTMLElement).closest('.hero');
    const frame = hero?.querySelector('.hero__media');
    if (frame instanceof HTMLElement) {
      armFilmFrame(frame, `still-${id}`);
    }
  }

  protected isSaved(id: number): boolean {
    return this.wishlist.isSaved(id);
  }
}
