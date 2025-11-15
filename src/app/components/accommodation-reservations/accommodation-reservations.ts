import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { AccommodationService } from '../../services/accommodation.service';
import { ReservationDTO, ReservationStatus } from '../../models/reservation.model';
import { AccommodationDTO, PageResponse } from '../../models/accommodation.model';
import Swal from 'sweetalert2';
import { timeout, finalize, catchError } from 'rxjs';
import { of } from 'rxjs';

@Component({
  selector: 'app-accommodation-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accommodation-reservations.html',
  styleUrl: './accommodation-reservations.css'
})
export class AccommodationReservations implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly accommodationService = inject(AccommodationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  accommodationId: number = 0;
  accommodation: AccommodationDTO | null = null;
  reservations: ReservationDTO[] = [];
  
  // Paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  
  isLoading: boolean = false;
  filterStatus: ReservationStatus | 'ALL' = 'ALL';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.accommodationId = +params['id'];
      this.loadAccommodation();
      this.loadReservations();
    });
  }

  loadAccommodation(): void {
    this.accommodationService.findById(this.accommodationId).subscribe({
      next: (accommodation) => {
        this.accommodation = accommodation;
      },
      error: (error) => {
        console.error('Error al cargar el alojamiento:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del alojamiento'
        });
      }
    });
  }

  loadReservations(): void {
    this.isLoading = true;
    
    this.reservationService.getByAccommodation(this.accommodationId, this.currentPage, this.pageSize)
      .pipe(
        timeout(10000),
        catchError((error) => {
          console.error('Error en catchError:', error);
          
          if (error.name === 'TimeoutError') {
            Swal.fire({
              icon: 'error',
              title: 'Tiempo de espera excedido',
              text: 'El servidor tardó demasiado en responder. Intenta de nuevo más tarde.'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar las reservas'
            });
          }
          
          return of({
            content: [],
            totalPages: 0,
            totalElements: 0,
            empty: true,
            first: true,
            last: true,
            number: 0,
            numberOfElements: 0,
            size: this.pageSize,
            pageable: {
              pageNumber: 0,
              pageSize: this.pageSize,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: 0,
              paged: true,
              unpaged: false
            },
            sort: { empty: true, sorted: false, unsorted: true }
          } as PageResponse<ReservationDTO>);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: PageResponse<ReservationDTO>) => {
          console.log('Respuesta de reservas:', response);
          this.reservations = response.content || [];
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;
        },
        error: (error) => {
          console.error('Error en subscribe (no debería llegar aquí):', error);
        }
      });
  }

  get filteredReservations(): ReservationDTO[] {
    if (this.filterStatus === 'ALL') {
      return this.reservations;
    }
    return this.reservations.filter(r => r.status === this.filterStatus);
  }

  getCountByStatus(status: ReservationStatus): number {
    return this.reservations.filter(r => r.status === status).length;
  }

  setFilter(status: ReservationStatus | 'ALL'): void {
    this.filterStatus = status;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadReservations();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadReservations();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadReservations();
    }
  }

  updateReservationStatus(reservationId: number, status: ReservationStatus): void {
    const statusText = {
      'CONFIRMED': 'confirmar',
      'CANCELLED': 'cancelar',
      'COMPLETED': 'completar',
      'PENDING': 'poner como pendiente'
    };

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a ${statusText[status]} esta reserva`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#48bb78',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservationService.updateStatus(reservationId, status).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'El estado de la reserva ha sido actualizado correctamente'
            });
            this.loadReservations();
          },
          error: (error) => {
            console.error('Error al actualizar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el estado de la reserva'
            });
          }
        });
      }
    });
  }

  getStatusBadgeClass(status: ReservationStatus): string {
    const classes: { [key in ReservationStatus]: string } = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed'
    };
    return classes[status];
  }

  getStatusText(status: ReservationStatus): string {
    const texts: { [key in ReservationStatus]: string } = {
      'PENDING': 'Pendiente',
      'CONFIRMED': 'Confirmada',
      'CANCELLED': 'Cancelada',
      'COMPLETED': 'Completada'
    };
    return texts[status];
  }

  goBack(): void {
    this.router.navigate(['/mis-alojamientos']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  calculateDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
