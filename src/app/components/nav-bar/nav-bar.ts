import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  public readonly router = inject(Router);

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.tokenService.removeToken();
    this.isHostValue = false;
    this.checkedHost = false;
    Swal.fire({
      icon: 'info',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      this.router.navigate(['/']);
    });
  }

  public isHostValue: boolean = false;
  private checkedHost: boolean = false;

  isHost(): boolean {
    if (!this.checkedHost && this.isAuthenticated()) {
      this.checkedHost = true;
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.isHostValue = user.roles?.includes(UserRole.HOST) || false;
        },
        error: () => {
          this.isHostValue = false;
        }
      });
    }
    return this.isHostValue;
  }
}
