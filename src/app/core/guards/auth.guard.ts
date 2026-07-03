import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Guard que protege rutas autenticadas.
 * Si no hay perfil cargado pero existe un token, intenta cargarlo.
 * Si falla, redirige al login.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  if (auth.token) {
    return auth.loadProfile().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return false;
};
