import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, fromEvent } from 'rxjs';

import { Auth } from '../../../core/services/auth';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  private readonly accountRoot = viewChild<ElementRef<HTMLElement>>('accountRoot');

  protected readonly account = this.auth.currentUser;
  protected readonly query = signal('');
  protected readonly menuOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly accountOpen = signal(false);
  protected readonly accountError = signal<string | null>(null);
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
        this.accountOpen.set(false);
      });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event.key === 'Escape') {
          this.menuOpen.set(false);
          this.searchOpen.set(false);
          this.accountOpen.set(false);
        }
      });

    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        const target = event.target;
        const root = this.accountRoot()?.nativeElement;
        if (target instanceof Node && root?.contains(target)) {
          return;
        }
        this.accountOpen.set(false);
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
    this.accountOpen.set(false);
  }

  protected toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    this.menuOpen.set(false);
    this.accountOpen.set(false);
  }

  protected toggleAccount(): void {
    this.accountOpen.update((open) => !open);
    this.menuOpen.set(false);
    this.searchOpen.set(false);
    this.accountError.set(null);
  }

  protected initials(name: string): string {
    const letters = name
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.charAt(0));
    return letters.join('').toUpperCase() || 'F';
  }

  protected logout(): void {
    this.accountError.set(null);
    this.auth
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.accountOpen.set(false);
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.accountError.set('Log out failed. Try again.');
        },
      });
  }
}
