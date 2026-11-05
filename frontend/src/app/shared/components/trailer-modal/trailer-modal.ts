import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { Icon } from '../icon/icon';

@Component({
  selector: 'app-trailer-modal',
  imports: [Icon],
  templateUrl: './trailer-modal.html',
  host: {
    class: 'fixed inset-0 z-50',
    '(document:keydown.escape)': 'close()',
  },
})
export class TrailerModal {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  readonly videoKey = input.required<string>();
  readonly title = input('Trailer');
  readonly closed = output<void>();

  protected readonly loading = signal(true);
  protected readonly embedUrl = computed(() => this.trustedEmbed(this.videoKey()));

  constructor() {
    const root = document.documentElement.style.overflow;
    const body = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    inject(DestroyRef).onDestroy(() => {
      document.documentElement.style.overflow = root;
      document.body.style.overflow = body;
    });

    afterNextRender(() => this.closeButton()?.nativeElement.focus());
  }

  protected close(): void {
    this.closed.emit();
  }

  protected ready(): void {
    this.loading.set(false);
  }

  /** The key is already constrained to a YouTube id, so the embed URL cannot point elsewhere. */
  private trustedEmbed(key: string): SafeResourceUrl | null {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(key)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${key}?rel=0`,
    );
  }
}
