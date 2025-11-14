import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { ReservationDTO } from '../../models/reservation.model';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CommentService } from '../../services/comment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass, RouterModule, FormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit {
  reservations: ReservationDTO[] = [];
  loading = true;
  errorMessage = '';
  selectedReservation: ReservationDTO | null = null;
  rating: number = 5;
  commentText: string = '';

  constructor(
    private reservationService: ReservationService,
    private accommodationService: AccommodationService,
    private commentService: CommentService,
    private router: Router,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    Swal.fire({
      title: 'Cargando reservas...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.reservationService.findByUser(0, 10).subscribe({
      next: (res: any) => {
        this.reservations = res.content || res || [];

        if (!this.reservations || this.reservations.length === 0) {
          this.loading = false;
          Swal.close();
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
            Swal.close();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = 'Error al cargar los alojamientos.';
            
            Swal.fire({
              icon: 'error',
              title: 'Error al cargar alojamientos',
              text: err?.error?.message || err?.error?.details?.detalle || 'No se pudieron cargar los detalles de los alojamientos.',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#d33'
            });
            
            this.cdr.detectChanges(); 
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar las reservas.';
        console.error('Error cargando reservas:', err);
        
        const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudieron cargar las reservas. Intenta nuevamente.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar reservas',
          text: errorMessage,
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#d33'
        });
        
        this.cdr.detectChanges(); 
      }
    });
  }

  payReservation(reservationId: number): void {
    Swal.fire({
      title: 'Procesando pago...',
      text: 'Redirigiendo a la pasarela de pago',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.reservationService.payReservation(reservationId).subscribe({
      next: (res) => {
        window.location.href = res.paymentUrl;
      },
      error: (err) => {
        console.error('Error al iniciar el pago', err);
        this.errorMessage = 'No se pudo iniciar el pago. Intenta nuevamente.';
        
        const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudo iniciar el proceso de pago. Intenta nuevamente.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar pago',
          text: errorMessage,
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  cancelReservation(reservationId: number): void {
    Swal.fire({
      title: '¿Cancelar reserva?',
      text: '¿Estás seguro de que deseas cancelar esta reserva?',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      inputAttributes: {
        'aria-label': 'Motivo de cancelación'
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes proporcionar un motivo de cancelación';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          title: 'Cancelando reserva...',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
          showConfirmButton: false
        });

        this.reservationService.cancel(reservationId, result.value).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Reserva cancelada!',
              text: 'La reserva ha sido cancelada exitosamente.',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              this.loadReservations();
            });
          },
          error: (err) => {
            console.error('Error al cancelar reserva', err);
            this.errorMessage = 'No se pudo cancelar la reserva.';
            
            const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudo cancelar la reserva. Intenta nuevamente.';
            
            Swal.fire({
              icon: 'error',
              title: 'Error al cancelar',
              text: errorMessage,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#d33'
            });
            
            this.cdr.detectChanges();
          },
        });
      }
    });
  }

  canLeaveComment(r: ReservationDTO): boolean {
    return r.status === 'COMPLETED' && !r.comment;
  }

  openCommentDialog(r: ReservationDTO): void {
    this.selectedReservation = r;
    this.rating = 5;
    this.commentText = '';
  }

  closeCommentDialog(): void {
    this.selectedReservation = null;
    this.rating = 5;
    this.commentText = '';
  }

  submitComment(): void {
    if (!this.selectedReservation) return;

    // Validar que haya texto en el comentario
    if (!this.commentText || this.commentText.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Comentario vacío',
        text: 'Por favor escribe tu experiencia antes de enviar',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading mientras se envía el comentario
    Swal.fire({
      title: 'Enviando comentario...',
      html: 'Por favor espera mientras procesamos tu reseña',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.commentService.create(
      this.selectedReservation.id,
      this.selectedReservation.accommodationId,
      {
        rating: this.rating,
        text: this.commentText.trim()
      }
    ).subscribe({
      next: () => {
        // Cerrar el modal de comentario primero
        this.closeCommentDialog();
        
        // Mostrar notificación de éxito mejorada
        Swal.fire({
          icon: 'success',
          title: '¡Comentario publicado exitosamente!',
          html: `
            <div style="text-align: center; padding: 1rem 0;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div>
              <p style="font-size: 1.1rem; color: #2c3e50; margin-bottom: 0.5rem;">
                Gracias por compartir tu experiencia
              </p>
              <p style="font-size: 0.95rem; color: #7f8c8d;">
                Tu reseña de <strong>${this.rating} ${this.rating === 1 ? 'estrella' : 'estrellas'}</strong> 
                ayuda a otros viajeros a tomar mejores decisiones
              </p>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: '¡Genial!',
          confirmButtonColor: '#28a745',
          allowOutsideClick: false,
          customClass: {
            popup: 'animated-popup',
            confirmButton: 'pulse-button'
          },
          timer: 4000,
          timerProgressBar: true,
          didOpen: () => {
            // Animación personalizada
            const popup = Swal.getPopup();
            if (popup) {
              popup.style.animation = 'slideInDown 0.5s ease-out';
            }
          }
        }).then(() => {
          // Recargar reservas para actualizar el estado
          this.loadReservations();
        });
      },
      error: (err) => {
        console.error('Error al enviar comentario:', err);
        
        const errorMessage = err?.error?.message || 
                            err?.error?.details?.detalle || 
                            'No se pudo enviar el comentario. Por favor intenta nuevamente.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar comentario',
          text: errorMessage,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Reintentar',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          // Si el usuario quiere reintentar, mantener el modal abierto
          if (!result.isConfirmed) {
            this.closeCommentDialog();
          }
        });
      }
    });
  }
}