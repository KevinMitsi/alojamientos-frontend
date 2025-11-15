import { Component, OnInit, inject, signal, computed, AfterViewInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { AccommodationDTO } from '../../models/accommodation.model';
import { CommentListComponent } from '../comment/comment';
import { MapService } from '../../services/map-service';
import { ReservationService } from '../../services/reservation.service';
import { CreateReservationDTO } from '../../models/reservation.model';
import { ReservationDTO } from '../../models/reservation.model';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import 'flatpickr/dist/flatpickr.min.css';
@Component({
  selector: 'app-accommodation-detail',
  standalone: true,
  imports: [CommonModule, CommentListComponent],
  templateUrl: './accommodation-detail-component.html',
  styleUrl: './accommodation-detail-component.css'
})
export class AccommodationDetailComponent implements OnInit,AfterViewInit {
  private route = inject(ActivatedRoute);
  private accommodationService = inject(AccommodationService);
  private mapService = inject(MapService);
  private reservationService = inject(ReservationService);
  private router = inject(Router);
  private mapInitialized = signal(false);
  private calendarInstance: flatpickr.Instance | null | undefined;
private checkInCalendar: flatpickr.Instance | any;
private checkOutCalendar: flatpickr.Instance | any;

  


  // Datos del alojamiento
  accommodation = signal<AccommodationDTO | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  reservations = signal<ReservationDTO[]>([]);

  // Datos del formulario de reserva
  checkInDate = signal<string>('');
  checkOutDate = signal<string>('');
  guests = signal<number>(1);



  // Fecha mínima (hoy)
  minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fecha mínima para check-out (día después del check-in)
  minCheckOutDate = computed(() => {
    if (!this.checkInDate()) return this.minDate();
    
    const checkIn = new Date(this.checkInDate());
    checkIn.setDate(checkIn.getDate() + 1);
    return checkIn.toISOString().split('T')[0];
  });

  // Calcular número de noches
  totalNights = computed(() => {
    if (!this.checkInDate() || !this.checkOutDate()) return 1;

    const checkIn = new Date(this.checkInDate());
    const checkOut = new Date(this.checkOutDate());
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  });

  // Calcular precio total
  totalPrice = computed(() => {
    const acc = this.accommodation();
    if (!acc) return 0;
    return acc.pricePerNight * this.totalNights();
  });

  ngOnInit(): void {
   
     
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error.set('ID de alojamiento no encontrado');
      this.loading.set(false);
      return;
    }

    const accommodationId = Number(id);
    
    if (isNaN(accommodationId)) {
      this.error.set('ID de alojamiento inválido');
      this.loading.set(false);
      return;
    }

  this.accommodationService.findById(accommodationId)
  .subscribe({
    next: (data) => {
      this.accommodation.set(data);
      this.guests.set(Math.min(1, data.maxGuests));
      this.loading.set(false);
      this.initializeMapWhenReady();

      
      this.loadReservations(accommodationId);
    },
    error: (err) => {
      console.error('Error al cargar alojamiento:', err);
      this.error.set('No se pudo cargar el alojamiento.');
      this.loading.set(false);
      
      const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudo cargar el alojamiento. Intenta nuevamente.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar alojamiento',
        text: errorMessage,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33'
      });
    }
  });
 
      
  }


  ngAfterViewInit(): void {
    // Intentar inicializar el mapa si los datos ya están cargados
    this.initializeMapWhenReady();
  }

  private initializeMapWhenReady(): void {
  if (this.mapInitialized()) return;
  
  if (!this.loading() && this.accommodation() && !this.error()) {
    setTimeout(() => {
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        const acc = this.accommodation()!;
        
        // Crear el mapa centrado en las coordenadas del alojamiento
        this.mapService.create('map', acc.coordinates, 15);
        
        // Agregar marcador en la ubicación
        this.mapService.addMarker(
          acc.coordinates,
          acc.title,
          `${acc.address}, ${acc.city.name}`
        );
        
        this.mapInitialized.set(true);
      }
    }, 100);
  }
}

  // Método para obtener la imagen principal
  getPrimaryImage(): string {
    const acc = this.accommodation();
    if (!acc || !acc.images || acc.images.length === 0) {
      return 'https://placehold.co/800x600/e0e0e0/757575?text=Sin+Imagen';
    }
    
    const primary = acc.images.find(img => img.isPrimary);
    return primary?.url || acc.images[0]?.url || 'https://placehold.co/800x600/e0e0e0/757575?text=Sin+Imagen';
  }

  // Método para generar el array de estrellas
  getStarsArray(): boolean[] {
    const acc = this.accommodation();
    if (!acc) return [];
    
    const rating = Math.round(acc.avgRating);
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  // Generar opciones de huéspedes (1 hasta la capacidad máxima)
  getGuestOptions(): number[] {
    const acc = this.accommodation();
    if (!acc) return [1];
    
    return Array.from({ length: acc.maxGuests }, (_, i) => i + 1);
  }

  // Handlers de eventos
  onCheckInChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedDate = input.value;
    
    this.checkInDate.set(selectedDate);
    
    // Si el check-out es anterior o igual al nuevo check-in, resetear check-out
    if (this.checkOutDate() && this.checkOutDate() <= selectedDate) {
      this.checkOutDate.set('');
    }
  }

  onCheckOutChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checkOutDate.set(input.value);
  }

  onGuestsChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.guests.set(Number(select.value));
  }

onReserve(): void {
    const acc = this.accommodation();
    if (!acc) return;

    if (!this.checkInDate() || !this.checkOutDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas incompletas',
        text: 'Por favor selecciona las fechas de llegada y salida.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const dto: CreateReservationDTO = {
      accommodationId: acc.id,
      startDate: this.checkInDate(),
      endDate: this.checkOutDate(),
      guests: this.guests(),
    };

    Swal.fire({
      title: 'Procesando reserva...',
      text: 'Estamos creando tu reserva',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.reservationService.create(dto).subscribe({
      next: (res) => {
        const nights = this.totalNights();
        const total = this.totalPrice();
        
        Swal.fire({
          icon: 'success',
          title: '¡Reserva creada exitosamente!',
          html: `
            <p><strong>Estado:</strong> ${res.status}</p>
            <p><strong>Noches:</strong> ${nights}</p>
            <p><strong>Total:</strong> ${this.formatCurrency(total)}</p>
            <p class="mt-2">Recibirás un correo con los detalles de tu reserva.</p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6'
        }).then(() => {
          // Recargar las reservas para actualizar el calendario
          this.loadReservations(acc.id);
          // Redirigir a la página de reservas
          this.router.navigate(['/reservation']);
        });
      },
      error: (err) => {
        console.error(err);
        
        const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudo completar la reserva. Intenta nuevamente.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error al crear reserva',
          text: errorMessage,
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  // Método para mostrar SweetAlert
  showAlert(type: 'success' | 'error', title: string, message: string): void {
    Swal.fire({
      icon: type,
      title: title,
      html: message.replace(/\n/g, '<br>'),
      timer: 3500,
      showConfirmButton: false
    });
  }

  // Método para formatear fecha para visualización
  private formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Método para formatear moneda (público para usar en onReserve)
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

   private loadReservations(accommodationId: number) {
  this.reservationService.getByAccommodation(accommodationId).subscribe({
    next: (res) => {
      const content = (res as any).content ?? res;
      this.reservations.set(content);
      this.loading.set(false);

      // Espera un tick para que Angular pinte el HTML antes de inicializar Flatpickr
      setTimeout(() => this.initializeCalendar(), 200);
    },
    error: (err) => {
      this.loading.set(false);
      console.error('Error al cargar reservas del alojamiento:', err);
      
      const errorMessage = err?.error?.message || err?.error?.details?.detalle || 'No se pudieron cargar las reservas del alojamiento.';
      
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: errorMessage + ' El calendario puede no mostrar todas las fechas ocupadas.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f39c12'
      });
    },
  });
}


private initializeCalendar(): void {
  const reservedRanges = this.reservations().map((r) => ({
    from: r.startDate.split('T')[0],
    to: r.endDate.split('T')[0],
    status: r.status,
  }));

  const baseConfig: flatpickr.Options.Options = {
    minDate: 'today',
    locale: Spanish,
    dateFormat: 'Y-m-d',

    onDayCreate: (dObj, dStr, fp, dayElem) => {
      const dateStr = fp.formatDate(dayElem.dateObj, 'Y-m-d');

      for (const r of reservedRanges) {
        if (dateStr >= r.from && dateStr <= r.to) {
          // Colorea según el estado
          if (r.status === 'PENDING') {
            dayElem.classList.add('flatpickr-day--pending');
          } else if (r.status === 'COMPLETED') {
            dayElem.classList.add('flatpickr-day--completed');
          }

          // Desactiva selección
          dayElem.classList.add('flatpickr-disabled');
          dayElem.setAttribute('aria-disabled', 'true');
          dayElem.style.pointerEvents = 'none';
        }
      }
    },
  };

  // Configuración de Check-in
  const inConfig: flatpickr.Options.Options = {
    ...baseConfig,
    onChange: (dates) => {
      if (dates.length) {
        const date = dates[0];
        this.checkInDate.set(date.toISOString().split('T')[0]);
        if (this.checkOutCalendar) {
          this.checkOutCalendar.set('minDate', date);
        }
      }
    },
  };

  // Configuración de Check-out
  const outConfig: flatpickr.Options.Options = {
    ...baseConfig,
    onChange: (dates) => {
      if (dates.length) {
        const date = dates[0];
        this.checkOutDate.set(date.toISOString().split('T')[0]);
      }
    },
  };

  // Destruye instancias previas si existen
  if (this.checkInCalendar) this.checkInCalendar.destroy();
  if (this.checkOutCalendar) this.checkOutCalendar.destroy();

  // Inicializa los calendarios
  this.checkInCalendar = flatpickr('#checkInCalendar', inConfig);
  this.checkOutCalendar = flatpickr('#checkOutCalendar', outConfig);
}



 

  getDateStatus(date: string): 'completed' | 'pending' | null {
    if (!date) return null;
    const selected = new Date(date + 'T00:00:00');

    for (const r of this.reservations()) {
      const start = new Date(r.startDate.split('T')[0] + 'T00:00:00');
      const end = new Date(r.endDate.split('T')[0] + 'T00:00:00');

      if (selected >= start && selected <= end) {
        if (r.status === 'COMPLETED') return 'completed';
        if (r.status === 'PENDING') return 'pending';
      }
    }
    return null;
  }


}