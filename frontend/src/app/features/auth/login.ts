import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Auth, readAuthError, safeReturnUrl } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly returnUrl = input<string | null>(null);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly fieldErrors = signal<Readonly<Record<string, string>>>({});

  protected onEmail(event: Event): void {
    this.email.set(this.value(event));
  }

  protected onPassword(event: Event): void {
    this.password.set(this.value(event));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.pending()) {
      return;
    }

    const email = this.email().trim();
    const password = this.password();
    const fields: Record<string, string> = {};
    if (!email) {
      fields['email'] = 'Enter your email.';
    } else if (!email.includes('@')) {
      fields['email'] = 'Enter a valid email.';
    }
    if (!password) {
      fields['password'] = 'Enter your password.';
    }
    this.fieldErrors.set(fields);
    this.formError.set(null);
    if (Object.keys(fields).length > 0) {
      return;
    }

    this.pending.set(true);
    this.auth
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
        },
        error: (error: unknown) => {
          this.pending.set(false);
          const failure = readAuthError(error);
          this.fieldErrors.set(failure.fields);
          this.formError.set(failure.message);
        },
      });
  }

  private value(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }
}
