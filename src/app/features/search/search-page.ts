import { Component, computed, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { EMPTY_MOVIE_PAGE } from '../../core/models/movie';
import { formatCount } from '../../core/format';
import { catalogueErrorCopy } from '../../core/services/tmdb-auth';
import { Tmdb } from '../../core/services/tmdb';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { previewHighlights } from '../../shared/preview/preview-catalog';

@Component({
  selector: 'app-search-page',
  imports: [MovieCard],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPage {
  private readonly tmdb = inject(Tmdb);

  readonly q = input('');

  /** The router supplies `undefined` when the query param is absent. */
  protected readonly term = computed(() => this.q()?.trim() ?? '');
  protected readonly configured = this.tmdb.isConfigured();
  protected readonly errorCopy = catalogueErrorCopy;
  protected readonly formatCount = formatCount;
  protected readonly highlights = previewHighlights();
  protected readonly results = rxResource({
    params: () => this.term(),
    stream: ({ params }) => (params ? this.tmdb.search(params) : of(EMPTY_MOVIE_PAGE)),
  });

  constructor() {
    inject(Title).setTitle('Search · FRAME');
  }
}
