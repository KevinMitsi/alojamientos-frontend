import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
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
  public readonly router = inject(Router);

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.tokenService.removeToken();
    Swal.fire({
      icon: 'info',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      this.router.navigate(['/**']);
    });
  }
}
