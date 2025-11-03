// src/app/components/reservations/reservations.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { MercadoPagoService } from '../../services/mercado-pago.service';
import { ReservationDTO } from '../../models/reservation.model';
import { CommonModule, DatePipe, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
    private mercadoPagoService: MercadoPagoService,
    private accommodationService: AccommodationService,
    private router: Router,
    private cdr: ChangeDetectorRef   
  ) {}

  ngOnInit(): void {
    this.loadReservations();
    this.checkPaymentStatus();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reservationService.findByUser(0, 10).subscribe({
      next: (res: any) => {
        this.reservations = res.content || res || [];

        if (!this.reservations || this.reservations.length === 0) {
          this.loading = false;
          this.cdr.detectChanges(); 
          return;
        }

        const uniqueIds = Array.from(new Set(this.reservations.map(r => r.accommodationId)));
        const calls = uniqueIds.map(id =>
          this.accommodationService.findById(id).pipe(
            catchError(err => {
              console.error(`Error cargando alojamiento ${id}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(calls).subscribe({
          next: (accommodations: any[]) => {
            const map = new Map<number, any>();
            accommodations.forEach((acc, idx) => {
              if (acc) map.set(uniqueIds[idx], acc);
            });

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
              return { ...r };
            });

            this.reservations = [...this.reservations];
            this.loading = false;

            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.errorMessage = 'Error al cargar los alojamientos.';
            this.cdr.detectChanges(); 
          },
        });
      },
     error: (err) => {
  this.loading = false;
  this.errorMessage = 'Error al cargar las reservas.';
  console.error('Error cargando reservas:', err);

  // 🔁 Reintento automático en caso de error temporal (por ejemplo, JWT aún no listo)
  setTimeout(() => {
    if (!this.reservations.length) {
      console.log('Reintentando cargar reservas...');
      this.loadReservations();
    }
  }, 1500);

  this.cdr.detectChanges();
}

    });
  }

  /**
   * Iniciar proceso de pago con MercadoPago
   */
  payReservation(reservationId: number): void {
    // Mostrar loading
    Swal.fire({
      title: 'Procesando...',
      text: 'Creando preferencia de pago en MercadoPago',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Crear preferencia de pago en MercadoPago
    this.mercadoPagoService.createPreference(reservationId).subscribe({
      next: (paymentUrl: string) => {
        console.log('✅ URL de pago recibida:', paymentUrl);
        
        // Cerrar el loading
        Swal.close();
        
        // Guardar el ID de la reserva en localStorage para verificar después
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('pending_payment_reservation', reservationId.toString());
        }

        // Mostrar confirmación antes de redirigir
        Swal.fire({
          icon: 'success',
          title: '¡Listo para pagar!',
          html: `
            <p>Serás redirigido a MercadoPago para completar tu pago de forma segura.</p>
            <small class="text-muted">Puedes usar las tarjetas de prueba proporcionadas</small>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Ir a pagar',
          confirmButtonColor: '#0069d9',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            // Redirigir a MercadoPago
            window.location.href = paymentUrl;
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al iniciar el pago:', err);
        
        let errorMessage = 'No se pudo iniciar el proceso de pago.';
        
        // Intentar extraer mensaje de error específico
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          html: `
            <p><strong>${errorMessage}</strong></p>
            <hr>
            <small class="text-muted">
              <strong>Posibles causas:</strong><br>
              • Token de MercadoPago inválido o expirado<br>
              • Conexión con MercadoPago interrumpida<br>
              • Datos de la reserva incompletos
            </small>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545',
          footer: '<a href="https://www.mercadopago.com.co/developers" target="_blank">Ver documentación de MercadoPago</a>'
        });

        this.errorMessage = errorMessage;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Verificar si hay un pago pendiente de confirmación
   * (cuando el usuario regresa de MercadoPago)
   */
checkPaymentStatus(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  const reservationId = urlParams.get('reservationId') || window.localStorage.getItem('pending_payment_reservation');

  if (!status || !reservationId) return;

  const resId = parseInt(reservationId, 10);

  if (status === 'approved' || status === 'COMPLETED') {
  this.mercadoPagoService.confirmPayment(resId, 'COMPLETED').subscribe({
    next: () => {
      window.localStorage.removeItem('pending_payment_reservation');
      Swal.fire({
        icon: 'success',
        title: '¡Pago exitoso!',
        text: 'Tu reserva ha sido confirmada',
        confirmButtonText: 'Ver mis reservas'
      }).then(() => {
        // ✅ Refresca directamente las reservas
        this.loadReservations();
        // Limpia los parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    },
    error: (err) => {
      console.error('Error al confirmar pago:', err);
      Swal.fire({
        icon: 'warning',
        title: 'Pago procesado',
        text: 'El pago fue procesado pero no se actualizó la reserva. Contacta soporte.',
      });
    }
  });
}

       else if (status === 'pending') {
        window.localStorage.removeItem('pending_payment_reservation');
        Swal.fire({
          icon: 'info',
          title: 'Pago pendiente',
          text: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          confirmButtonText: 'Entendido'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (status === 'failure' || status === 'rejected') {
        window.localStorage.removeItem('pending_payment_reservation');
        Swal.fire({
          icon: 'error',
          title: 'Pago rechazado',
          text: 'El pago no pudo ser procesado. Por favor, intenta nuevamente.',
          confirmButtonText: 'Entendido'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  

  cancelReservation(reservationId: number): void {
    Swal.fire({
      title: '¿Cancelar reserva?',
      text: '¿Por qué deseas cancelar esta reserva?',
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar reserva',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes escribir un motivo';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const motivo = result.value;

        Swal.fire({
          title: 'Cancelando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.reservationService.cancel(reservationId, motivo).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Reserva cancelada',
              text: 'Tu reserva ha sido cancelada exitosamente',
              confirmButtonText: 'Entendido'
            }).then(() => {
              this.loadReservations();
            });
          },
          error: (err) => {
            console.error('Error al cancelar reserva', err);
            Swal.fire({
              icon: 'error',
              title: 'Error al cancelar',
              text: err.error?.message || 'No se pudo cancelar la reserva. Intenta nuevamente.',
              confirmButtonText: 'Entendido'
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}