import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type MovieSummary } from '../../../core/models/movie';
import { Wishlist } from '../../../core/services/wishlist';
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

  protected markImageFailed(): void {
    this.imageFailed.set(true);
  }
}
