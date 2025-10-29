import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Guard que previene el acceso a rutas de autenticación (login/register) 
 * cuando el usuario ya está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Si el usuario está logueado, redirigir a la página principal
  if (tokenService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  // Si no está logueado, permitir el acceso
  return true;
};
