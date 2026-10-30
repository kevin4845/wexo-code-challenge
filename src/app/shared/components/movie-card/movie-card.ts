import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type MovieSummary } from '../../../core/models/movie';
import { Wishlist } from '../../../core/services/wishlist';
import { armFilmFrame } from '../../motion/film-transition';
import { displayImage } from '../../preview/preview-catalog';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-movie-card',
  imports: [RouterLink, Icon],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  private readonly wishlist = inject(Wishlist);

  readonly movie = input.required<MovieSummary>();
  /** Wishlist page keeps the remove control visible without a hover. */
  readonly alwaysShowAction = input(false);

  protected readonly imageFailed = signal(false);
  protected readonly saved = computed(() => this.wishlist.isSaved(this.movie().id));
  protected readonly posterUrl = computed(() =>
    this.imageFailed() ? null : displayImage(this.movie().posterPath, 'w342'),
  );

  protected toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggle(this.movie());
  }

  /** Name the poster before the router snapshots the page, so it can continue into the film. */
  protected armPoster(event: Event): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter') {
      return;
    }
    const article = (event.currentTarget as HTMLElement).closest('article');
    const frame = article?.querySelector('img, .card__fallback');
    if (frame instanceof HTMLElement) {
      armFilmFrame(frame, `poster-${this.movie().id}`);
    }
  }

  protected markImageFailed(): void {
    this.imageFailed.set(true);
  }
}
