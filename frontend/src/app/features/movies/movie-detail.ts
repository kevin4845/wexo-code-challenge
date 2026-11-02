import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { formatReleaseDate, formatRuntime, formatVote, languageName } from '../../core/format';
import {
  summaryFromDetails,
  type CastMember,
  type MovieDetails,
  type MovieSummary,
  type WatchAvailability,
  type WatchProvider,
} from '../../core/models/movie';
import { catalogueErrorCopy, tmdbConfigMessage } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { Wishlist } from '../../core/services/wishlist';
import { displayImage } from '../../shared/preview/preview-catalog';
import { Icon } from '../../shared/components/icon/icon';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

type DetailTab = 'overview' | 'cast' | 'similar';

@Component({
  selector: 'app-movie-detail',
  imports: [Icon, MovieCard, RouterLink],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetail {
  private readonly tmdb = inject(Tmdb);
  private readonly wishlist = inject(Wishlist);
  private readonly title = inject(Title);

  readonly id = input.required<string>();

  protected readonly configured = this.tmdb.isConfigured();
  protected readonly errorCopy = catalogueErrorCopy;
  protected readonly configMessage = tmdbConfigMessage;
  protected readonly imageUrl = displayImage;
  protected readonly formatRuntime = formatRuntime;
  protected readonly formatReleaseDate = formatReleaseDate;
  protected readonly formatVote = formatVote;
  protected readonly languageName = languageName;
  protected readonly tab = signal<DetailTab>('overview');
  protected readonly overviewOpen = signal(false);

  protected readonly movie = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.movie(params),
  });

  protected readonly credits = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.credits(params),
  });

  protected readonly trailer = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.trailer(params),
  });

  protected readonly providers = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.watchProviders(params),
  });

  protected readonly similar = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.recommendations(params),
  });

  constructor() {
    effect(() => {
      // value() throws while the resource is loading or has failed, which blanks the page.
      const film = this.shownFilm();
      this.title.setTitle(film ? `${film.title} · FRAME` : 'Film · FRAME');
    });

    effect(() => {
      this.id();
      untracked(() => this.overviewOpen.set(false));
    });
  }

  protected toggleOverview(): void {
    this.overviewOpen.update((open) => !open);
  }

  /** Short blurbs already fit the mobile clamp, so they do not need a toggle. */
  protected overviewCanExpand(overview: string): boolean {
    return overview.length > 160;
  }

  protected selectTab(tab: DetailTab): void {
    this.tab.set(tab);
  }

  protected shownFilm(): MovieDetails | null {
    return this.movie.hasValue() ? this.movie.value() : null;
  }

  protected toggle(movie: MovieDetails): void {
    this.wishlist.toggle(summaryFromDetails(movie));
  }

  protected isSaved(id: number): boolean {
    return this.wishlist.isSaved(id);
  }

  protected trailerHref(): string | null {
    if (!this.trailer.hasValue()) {
      return null;
    }
    const trailer = this.trailer.value();
    return trailer ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}` : null;
  }

  protected writerNames(): string | null {
    if (!this.credits.hasValue() || this.credits.value().writers.length === 0) {
      return null;
    }
    return this.credits
      .value()
      .writers.map((writer) => writer.name)
      .join(', ');
  }

  /** Cast shown on the detail page. */
  protected creditCast(limit: number): readonly CastMember[] {
    if (!this.credits.hasValue()) {
      return [];
    }
    return this.credits.value().cast.slice(0, limit);
  }

  protected directorName(): string | null {
    if (!this.credits.hasValue()) {
      return null;
    }
    return this.credits.value().director?.name ?? null;
  }

  protected similarFilms(): readonly MovieSummary[] {
    return this.similar.hasValue() ? this.similar.value() : [];
  }

  protected genreLabel(movie: MovieDetails): string {
    return movie.genres.map((genre) => genre.name).join(', ');
  }

  protected portraitUrl(path: string | null): string | null {
    return displayImage(path, 'w185');
  }

  protected providerLogo(path: string | null): string | null {
    return displayImage(path, 'w92');
  }

  /** Hidden when Denmark has no streaming, rental, or purchase offer. */
  protected watchOffer(): WatchAvailability | null {
    if (!this.providers.hasValue()) {
      return null;
    }

    const offer = this.providers.value();
    if (offer.flatrate.length + offer.rent.length + offer.buy.length === 0) {
      return null;
    }

    return offer;
  }

  protected watchCategories(): readonly {
    id: string;
    label: string;
    providers: readonly WatchProvider[];
  }[] {
    const offer = this.watchOffer();
    if (!offer) {
      return [];
    }

    return [
      { id: 'flatrate', label: 'Now Streaming', providers: offer.flatrate },
      { id: 'rent', label: 'Rent', providers: offer.rent },
      { id: 'buy', label: 'Buy', providers: offer.buy },
    ].filter((category) => category.providers.length > 0);
  }
}
