import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { AuthService } from '../../services/auth.service';
import { AccommodationDTO, PageResponse } from '../../models/accommodation.model';
import { User } from '../../models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-accommodations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-accommodations.html',
  styleUrl: './my-accommodations.css'
})
export class MyAccommodations implements OnInit {
  private readonly accommodationService = inject(AccommodationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  accommodations: AccommodationDTO[] = [];
  
  // Paginación
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = 0;
  totalElements: number = 0;
  
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadAccommodations();
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

  loadAccommodations(): void {
    this.isLoading = true;
    this.accommodationService.findByHost(this.currentPage, this.pageSize).subscribe({
      next: (response: PageResponse<AccommodationDTO>) => {
        this.accommodations = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar alojamientos:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar tus alojamientos'
        });
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAccommodations();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadAccommodations();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAccommodations();
    }
  }

  viewAccommodationDetail(id: number): void {
    this.router.navigate(['/accommodation', id]);
  }

  editAccommodation(id: number): void {
    // TODO: Implementar edición de alojamiento
    Swal.fire({
      icon: 'info',
      title: 'Próximamente',
      text: 'La funcionalidad de edición estará disponible pronto'
    });
  }

  deleteAccommodation(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el alojamiento',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.accommodationService.delete(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El alojamiento ha sido eliminado correctamente'
            });
            this.loadAccommodations();
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el alojamiento'
            });
          }
        });
      }
    });
  }

  goToReservations(): void {
    this.router.navigate(['/reservation']);
  }

  getPrimaryImage(accommodation: AccommodationDTO): string {
    const primaryImage = accommodation.images?.find(img => img.isPrimary);
    return primaryImage?.url || accommodation.images?.[0]?.url || 'assets/placeholder.jpg';
  }
}
