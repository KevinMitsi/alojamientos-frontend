import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { ReservationDTO } from '../../models/reservation.model';
import { CommonModule, DatePipe, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, NgClass, RouterModule, NgOptimizedImage],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit {

  reservations: ReservationDTO[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private reservationService: ReservationService,
    private accommodationService: AccommodationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reservationService.findByUser(0, 10).subscribe({
      next: (res: any) => {
        // Adaptamos si el backend devuelve Page o solo array
        this.reservations = res.content || res || [];

        // Si no hay reservas, terminamos
        if (!this.reservations || this.reservations.length === 0) {
          this.loading = false;
          return;
        }

        // 1) obtener IDs únicos de alojamiento
        const uniqueIds = Array.from(new Set(this.reservations.map(r => r.accommodationId)));

        // 2) crear array de observables para cada id
        const calls = uniqueIds.map(id =>
          this.accommodationService.findById(id).pipe(
            // Si una llamada falla, la convertimos en null para no romper forkJoin
            catchError(err => {
              console.error(`Error cargando alojamiento ${id}:`, err);
              return of(null);
            })
          )
        );

        // 3) ejecutar en paralelo
       forkJoin(calls).subscribe({
  next: (accommodations: any[]) => {
    const map = new Map<number, any>();
    accommodations.forEach((acc, idx) => {
      if (acc) map.set(uniqueIds[idx], acc);
    });

    // Clonamos el arreglo para que Angular detecte cambios correctamente
    this.reservations = this.reservations.map(r => {
      const acc = map.get(r.accommodationId);
      if (acc) {
        r.accommodationName = acc.title ?? 'Alojamiento';
        if (acc.images?.length) {
          const primary = acc.images.find((img: any) => img.isPrimary);
          r.imageUrl = primary ? primary.url : acc.images[0].url;
        } else if (acc.primaryImageUrl) {
          r.imageUrl = acc.primaryImageUrl;
        }
      }
      return { ...r }; // <- 👈 forzamos cambio detectado
    });

    this.reservations = [...this.reservations]; // 👈 refresca el *ngFor
    this.loading = false;
  },
  error: () => {
    this.loading = false;
    this.errorMessage = 'Error al cargar los alojamientos.';
  },
});

      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar las reservas.';
        console.error('Error cargando reservas:', err);
      }
    });
  }

  payReservation(reservationId: number): void {
    this.reservationService.payReservation(reservationId).subscribe({
      next: (res) => {
        window.location.href = res.paymentUrl;
      },
      error: (err) => {
        console.error('Error al iniciar el pago', err);
        this.errorMessage = 'No se pudo iniciar el pago. Intenta nuevamente.';
      },
    });
  }

  cancelReservation(reservationId: number): void {
    const motivo = prompt('¿Por qué deseas cancelar esta reserva?');
    if (motivo) {
      this.reservationService.cancel(reservationId, motivo).subscribe({
        next: () => this.loadReservations(),
        error: (err) => {
          console.error('Error al cancelar reserva', err);
          this.errorMessage = 'No se pudo cancelar la reserva.';
        },
      });
    }
  }
}
