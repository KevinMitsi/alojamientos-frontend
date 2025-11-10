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
  imports: [CommonModule, DatePipe, NgClass, RouterModule,FormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit {

  reservations: ReservationDTO[] = [];
  loading = true;
  errorMessage = '';
  selectedReservation: ReservationDTO | null = null;
  rating: number =5;
  commentText: string='';

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
}

submitComment(): void {
  if (!this.selectedReservation) return;

  this.commentService.create(
    this.selectedReservation.id,
    this.selectedReservation.accommodationId,
    {
      rating: this.rating,
      text: this.commentText
    }
  ).subscribe({
    next: () => {
      Swal.fire({
        title: '¡Comentario enviado!',
        text: 'Gracias por compartir tu experiencia.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1800,
        background: '#fefefe',
        color: '#333',
        backdrop: `
          rgba(0,0,0,0.4)
          left top
          no-repeat
        `,
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) {
            popup.classList.add('animate__animated', 'animate__fadeInDown');
          }
        }
      });

      this.closeCommentDialog();
      this.loadReservations();
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Error al comentar',
        text: err.error?.message || 'No se pudo enviar el comentario',
        confirmButtonColor: '#d33'
      });
    }
  });
}



  
}
