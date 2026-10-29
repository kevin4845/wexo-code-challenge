import { Component, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { formatReleaseDate, formatRuntime, formatVote, languageName } from '../../core/format';
import {
  summaryFromDetails,
  type CastMember,
  type MovieDetails,
  type MovieSummary,
} from '../../core/models/movie';
import { catalogueErrorCopy } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { Wishlist } from '../../core/services/wishlist';
import {
  displayImage,
  previewCast,
  previewDetails,
  previewDirector,
  previewRelated,
  previewWriters,
} from '../../shared/preview/preview-catalog';
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
  protected readonly imageUrl = displayImage;
  protected readonly formatRuntime = formatRuntime;
  protected readonly formatReleaseDate = formatReleaseDate;
  protected readonly formatVote = formatVote;
  protected readonly languageName = languageName;
  protected readonly tab = signal<DetailTab>('overview');

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

  protected readonly similar = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.tmdb.similar(params),
  });

  constructor() {
    effect(() => {
      // value() throws while the resource is loading or has failed, which blanks the page.
      const film = this.shownFilm();
      this.title.setTitle(film ? `${film.title} · FRAME` : 'Film · FRAME');
    });
  }

  protected selectTab(tab: DetailTab): void {
    this.tab.set(tab);
  }

  protected shownFilm(): MovieDetails | null {
    if (this.movie.hasValue()) {
      return this.movie.value();
    }
    if (this.configured && this.movie.isLoading()) {
      return null;
    }
    return previewDetails(Number(this.id()));
  }

  protected usingPreview(): boolean {
    return !this.movie.hasValue() && previewDetails(Number(this.id())) !== null;
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
    if (this.credits.hasValue() && this.credits.value().writers.length > 0) {
      return this.credits
        .value()
        .writers.map((writer) => writer.name)
        .join(', ');
    }
    return this.usingPreview() ? previewWriters() : null;
  }

  /** Cast shown on the detail page. Preview portraits stand in until credits arrive. */
  protected creditCast(limit: number): readonly CastMember[] {
    if (this.credits.hasValue() && this.credits.value().cast.length > 0) {
      return this.credits.value().cast.slice(0, limit);
    }
    return this.usingPreview() ? previewCast().slice(0, limit) : [];
  }

  protected directorName(): string | null {
    if (this.credits.hasValue() && this.credits.value().director) {
      return this.credits.value().director?.name ?? null;
    }
    return this.usingPreview() ? previewDirector() : null;
  }

  protected similarFilms(): readonly MovieSummary[] {
    if (this.similar.hasValue() && this.similar.value().length > 0) {
      return this.similar.value();
    }
    return this.usingPreview() ? previewRelated(Number(this.id())) : [];
  }

  protected genreLabel(movie: MovieDetails): string {
    return movie.genres.map((genre) => genre.name).join(', ');
  }

  protected portraitUrl(path: string | null): string | null {
    return displayImage(path, 'w185');
  }
}
