import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
