import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { Auth } from '../services/auth';

// The catalogue API is public. authGuard is what requires a session in the SPA.
// guestGuard keeps a signed-in user off the login and register screens.

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.checkAuthentication().pipe(
    map((authenticated) =>
      authenticated
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth
    .checkAuthentication()
    .pipe(map((authenticated) => (authenticated ? router.createUrlTree(['/']) : true)));
};
