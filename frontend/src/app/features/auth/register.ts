import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Auth, readAuthError, safeReturnUrl } from '../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly returnUrl = input<string | null>(null);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmation = signal('');
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly fieldErrors = signal<Readonly<Record<string, string>>>({});

  protected onName(event: Event): void {
    this.name.set(this.value(event));
  }

  protected onEmail(event: Event): void {
    this.email.set(this.value(event));
  }

  protected onPassword(event: Event): void {
    this.password.set(this.value(event));
  }

  protected onConfirmation(event: Event): void {
    this.confirmation.set(this.value(event));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.pending()) {
      return;
    }

    const name = this.name().trim();
    const email = this.email().trim();
    const password = this.password();
    const confirmation = this.confirmation();
    const fields: Record<string, string> = {};
    if (!name) {
      fields['name'] = 'Enter your name.';
    }
    if (!email) {
      fields['email'] = 'Enter your email.';
    } else if (!email.includes('@')) {
      fields['email'] = 'Enter a valid email.';
    }
    if (!password) {
      fields['password'] = 'Enter a password.';
    } else if (!this.strongEnough(password)) {
      fields['password'] =
        'Use at least 8 characters, with upper and lower case letters and a number.';
    }
    if (password !== confirmation) {
      fields['password_confirmation'] = 'The password confirmation does not match.';
    }
    this.fieldErrors.set(fields);
    this.formError.set(null);
    if (Object.keys(fields).length > 0) {
      return;
    }

    this.pending.set(true);
    this.auth
      .register(name, email, password, confirmation)
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

  private strongEnough(password: string): boolean {
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    );
  }

  private value(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }
}
