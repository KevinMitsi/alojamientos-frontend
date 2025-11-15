import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoriteService, Favorite } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import Swal from 'sweetalert2';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  private readonly favoriteService = inject(FavoriteService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  favorites: Favorite[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadFavorites();
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error al cargar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario'
        });
      }
    });
  }

  loadFavorites(): void {
    this.isLoading = true;
    
    this.favoriteService.getUserFavorites()
      .pipe(
        catchError((error) => {
          console.error('Error al cargar favoritos:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar tus favoritos'
          });
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (favorites: Favorite[]) => {
          this.favorites = favorites;
        }
      });
  }

  getPrimaryImage(favorite: Favorite): string {
    const primaryImage = favorite.accommodation.images?.find(img => img.isPrimary);
    return (
      primaryImage?.url ||
      favorite.accommodation.images?.[0]?.url ||
      'https://placehold.co/400x300/e0e0e0/757575?text=Sin+Imagen'
    );
  }

  viewAccommodationDetail(accommodationId: number): void {
    this.router.navigate(['/accommodation', accommodationId]);
  }

  exploreAccommodations(): void {
    this.router.navigate(['/']);
  }

  removeFavorite(favorite: Favorite): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres quitar "${favorite.accommodation.title}" de tus favoritos?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.favoriteService.removeFavorite(favorite.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El alojamiento ha sido quitado de favoritos',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadFavorites();
          },
          error: (error) => {
            console.error('Error al eliminar favorito:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo quitar el alojamiento de favoritos'
            });
          }
        });
      }
    });
  }
}
