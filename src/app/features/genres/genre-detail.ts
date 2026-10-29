import { Component, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { catalogGenre, normalizeSort } from '../../core/models/catalog';
import { type GenreSort, type MovieSummary } from '../../core/models/movie';
import { formatCount } from '../../core/format';
import { catalogueErrorCopy } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import {
  displayImage,
  previewGenreArt,
  previewMoviesForGenre,
} from '../../shared/preview/preview-catalog';
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

  readonly genreId = input.required<string>();
  readonly sort = input('popular');

  protected readonly configured = this.tmdb.isConfigured();
  protected readonly errorCopy = catalogueErrorCopy;
  protected readonly formatCount = formatCount;
  protected readonly sorts: readonly { id: GenreSort; label: string }[] = [
    { id: 'popular', label: 'Popular' },
    { id: 'latest', label: 'Latest' },
    { id: 'top-rated', label: 'Top rated' },
  ];

  protected readonly catalog = rxResource({
    params: () => ({
      genreId: Number(this.genreId()),
      sort: normalizeSort(this.sort()),
    }),
    stream: ({ params }) => this.tmdb.moviesByGenre(params.genreId, params.sort),
  });

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
    if (this.catalog.hasValue()) {
      const movie = this.catalog.value().movies.find((item) => item.backdropPath);
      const live = movie ? displayImage(movie.backdropPath, 'w1280') : null;
      if (live) {
        return live;
      }
    }
    return previewGenreArt(Number(this.genreId()));
  }

  /** Live catalogue when it arrived. The static row keeps the page designed before that. */
  protected gridMovies(): readonly MovieSummary[] {
    if (this.configured && this.catalog.hasValue() && this.catalog.value().movies.length > 0) {
      return this.catalog.value().movies;
    }
    if (this.configured) {
      return [];
    }
    return previewMoviesForGenre(Number(this.genreId()));
  }

  protected showingPreview(): boolean {
    return !this.configured;
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
  }
}
