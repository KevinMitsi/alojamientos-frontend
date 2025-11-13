import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Guard que protege rutas privadas, permitiendo acceso solo si el usuario está autenticado
 */
export const privateGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Si el usuario NO está logueado, redirigir al login
  if (!tokenService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Si está logueado, permitir el acceso
  return true;
};
