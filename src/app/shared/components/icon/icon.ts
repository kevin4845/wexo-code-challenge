import { Component, input } from '@angular/core';

export type IconName =
  'heart' | 'heart-filled' | 'play' | 'search' | 'clapper' | 'menu' | 'close' | 'arrow';

@Component({
  selector: 'app-icon',
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @switch (name()) {
        @case ('heart') {
          <path
            d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        }
        @case ('heart-filled') {
          <path
            d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
            fill="currentColor"
          />
        }
        @case ('play') {
          <path d="M8 6.5v11l9-5.5-9-5.5z" fill="currentColor" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.7" />
          <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        }
        @case ('clapper') {
          <path
            d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M4 9l2.2-4h3L7 9m2.2 0l2.2-4h3L12.2 9m2.2 0L16.6 5H20L17.6 9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        }
        @case ('menu') {
          <path
            d="M5 7h14M5 12h14M5 17h14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('close') {
          <path
            d="M7 7l10 10M17 7L7 17"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('arrow') {
          <path
            d="M5 12h14M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.15rem;
      height: 1.15rem;
      flex: 0 0 auto;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
