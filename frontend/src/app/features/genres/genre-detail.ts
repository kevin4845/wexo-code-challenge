import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catalogGenre, normalizeSort } from '../../core/models/catalog';
import { type GenreSort, type MoviePage, type MovieSummary } from '../../core/models/movie';
import { formatCount } from '../../core/format';
import { catalogueErrorCopy, tmdbConfigMessage } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { displayImage } from '../../shared/preview/preview-catalog';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-genre-detail',
  imports: [MovieCard],
  templateUrl: './genre-detail.html',
  styleUrl: './genre-detail.scss',
})
export class GenreDetail {
  private readonly tmdb = inject(Tmdb);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  private observer: IntersectionObserver | null = null;
  private generation = 0;
  private inFlightPage: number | null = null;

  readonly genreId = input.required<string>();
  readonly sort = input('popular');

  protected readonly configured = this.tmdb.isConfigured();
  protected readonly errorCopy = catalogueErrorCopy;
  protected readonly configMessage = tmdbConfigMessage;
  protected readonly formatCount = formatCount;
  protected readonly sorts: readonly { id: GenreSort; label: string }[] = [
    { id: 'popular', label: 'Popular' },
    { id: 'latest', label: 'Latest' },
    { id: 'top-rated', label: 'Top rated' },
  ];

  protected readonly movies = signal<readonly MovieSummary[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalResults = signal(0);
  protected readonly loadingFirst = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly loadError = signal<unknown>(null);
  protected readonly moreError = signal<unknown>(null);

  protected genreName(): string {
    return catalogGenre(Number(this.genreId()))?.name ?? 'Genre';
  }

  protected genreDescription(): string | null {
    return catalogGenre(Number(this.genreId()))?.description ?? null;
  }

  protected currentSort(): GenreSort {
    return normalizeSort(this.sort());
  }

  protected banner(): string | null {
    const movie = this.movies().find((item) => item.backdropPath);
    return movie ? displayImage(movie.backdropPath, 'w1280') : null;
  }

  protected retryFirst(): void {
    this.resetAndLoad(Number(this.genreId()), this.currentSort());
  }

  protected setSort(sort: GenreSort): void {
    void this.router.navigate([], {
      queryParams: { sort },
      queryParamsHandling: 'merge',
    });
  }

  constructor() {
    effect(() => {
      this.title.setTitle(`${this.genreName()} · FRAME`);
    });

    effect(() => {
      const genreId = Number(this.genreId());
      const sort = this.currentSort();
      untracked(() => this.resetAndLoad(genreId, sort));
    });

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.loadMore();
          }
        },
        { rootMargin: '640px 0px' },
      );
      this.destroyRef.onDestroy(() => this.observer?.disconnect());
      this.watchSentinel();
    });

    effect(() => {
      this.sentinel();
      untracked(() => this.watchSentinel());
    });
  }

  /** Asks TMDB for the next page. Ignored while a page is already in flight or the list is complete. */
  protected loadMore(): void {
    if (!this.configured || this.loadingFirst() || this.inFlightPage !== null) {
      return;
    }

    const current = this.page();
    const last = this.totalPages();
    if (current < 1 || current >= last) {
      return;
    }

    const next = current + 1;
    const genreId = Number(this.genreId());
    const sort = this.currentSort();
    const generation = this.generation;
    this.inFlightPage = next;
    this.loadingMore.set(true);
    this.moreError.set(null);

    this.tmdb
      .moviesByGenre(genreId, sort, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (generation !== this.generation) {
            return;
          }
          this.movies.update((currentMovies) => appendMovies(currentMovies, result.movies));
          this.page.set(result.page || next);
          this.totalPages.set(result.totalPages);
          this.totalResults.set(result.totalResults);
          this.inFlightPage = null;
          this.loadingMore.set(false);
          queueMicrotask(() => {
            if (generation === this.generation) {
              this.continueIfNeeded();
            }
          });
        },
        error: (error: unknown) => {
          if (generation !== this.generation) {
            return;
          }
          this.inFlightPage = null;
          this.loadingMore.set(false);
          this.moreError.set(error);
        },
      });
  }

  private resetAndLoad(genreId: number, sort: GenreSort): void {
    const generation = ++this.generation;
    this.inFlightPage = null;
    this.movies.set([]);
    this.page.set(0);
    this.totalPages.set(0);
    this.totalResults.set(0);
    this.loadingMore.set(false);
    this.loadError.set(null);
    this.moreError.set(null);

    if (!this.configured || !Number.isFinite(genreId)) {
      this.loadingFirst.set(false);
      return;
    }

    this.loadingFirst.set(true);
    this.tmdb
      .moviesByGenre(genreId, sort, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyFirstPage(generation, result),
        error: (error: unknown) => {
          if (generation !== this.generation) {
            return;
          }
          this.loadingFirst.set(false);
          this.loadError.set(error);
        },
      });
  }

  private applyFirstPage(generation: number, result: MoviePage): void {
    if (generation !== this.generation) {
      return;
    }
    this.movies.set(appendMovies([], result.movies));
    this.page.set(result.page || 1);
    this.totalPages.set(result.totalPages);
    this.totalResults.set(result.totalResults);
    this.loadingFirst.set(false);
    queueMicrotask(() => {
      if (generation === this.generation) {
        this.continueIfNeeded();
      }
    });
  }

  private watchSentinel(): void {
    const node = this.sentinel()?.nativeElement;
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    if (node) {
      this.observer.observe(node);
    }
  }

  /** A short list can leave the sentinel on screen, and the observer will not fire again. */
  private continueIfNeeded(): void {
    const node = this.sentinel()?.nativeElement;
    if (!node || this.loadingMore() || this.inFlightPage !== null) {
      return;
    }
    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 640) {
      this.loadMore();
    }
  }
}

function appendMovies(
  current: readonly MovieSummary[],
  incoming: readonly MovieSummary[],
): readonly MovieSummary[] {
  const seen = new Set(current.map((movie) => movie.id));
  const added = incoming.filter((movie) => {
    if (seen.has(movie.id)) {
      return false;
    }
    seen.add(movie.id);
    return true;
  });
  return added.length === 0 ? current : [...current, ...added];
}
