import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.model';

export function roleGuardFactory(rolRequerido: RolUsuario): CanActivateFn {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { redirectTo: state.url },
      });
    }

    if (authService.rol() === rolRequerido) {
      return true;
    }

    return router.createUrlTree(['/'], {
      queryParams: { sinPermiso: true },
    });
  };
}
