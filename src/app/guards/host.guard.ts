import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';
import { UserRole } from '../models/user.model';

/**
 * Guard que protege rutas que solo pueden ser accedidas por usuarios con rol HOST
 */
export const hostGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Primero verificar si el usuario está logueado
  if (!tokenService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el usuario tiene el rol HOST
  return authService.getCurrentUser().pipe(
    map(user => {
      const isHost = user.roles.includes(UserRole.HOST);
      
      if (!isHost) {
        // Si no es host, redirigir a la página principal
        router.navigate(['/']);
        return false;
      }
      
      return true;
    }),
    catchError(() => {
      // En caso de error, redirigir al login
      router.navigate(['/login']);
      return of(false);
    })
  );
};
