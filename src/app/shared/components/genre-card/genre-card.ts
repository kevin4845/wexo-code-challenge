import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatCount } from '../../../core/format';

@Component({
  selector: 'app-genre-card',
  imports: [RouterLink],
  templateUrl: './genre-card.html',
  styleUrl: './genre-card.scss',
})
export class GenreCard {
  readonly genreId = input.required<number>();
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly count = input<number | null>(null);

  protected readonly formatCount = formatCount;
}
