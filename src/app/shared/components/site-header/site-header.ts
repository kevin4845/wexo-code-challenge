import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, fromEvent } from 'rxjs';

import { Icon } from '../icon/icon';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly menuOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly exactLink = { exact: true };

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.searchOpen.set(false);
      });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event.key === 'Escape') {
          this.menuOpen.set(false);
          this.searchOpen.set(false);
        }
      });
  }

  protected onQuery(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.query.set(target.value);
    }
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const term = this.query().trim();
    if (!term) {
      return;
    }
    void this.router.navigate(['/search'], { queryParams: { q: term } });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.searchOpen.set(false);
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    this.menuOpen.set(false);
  }
}
