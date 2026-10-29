import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { formatCount } from '../../core/format';
import { Wishlist } from '../../core/services/wishlist';
import { Icon } from '../../shared/components/icon/icon';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { previewShelf } from '../../shared/preview/preview-catalog';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, MovieCard, Icon],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class WishlistPage {
  private readonly wishlist = inject(Wishlist);

  protected readonly items = this.wishlist.items;
  protected readonly count = this.wishlist.count;
  protected readonly formatCount = formatCount;
  protected readonly shelf = previewShelf();

  constructor() {
    inject(Title).setTitle('Wishlist · FRAME');
  }
}
