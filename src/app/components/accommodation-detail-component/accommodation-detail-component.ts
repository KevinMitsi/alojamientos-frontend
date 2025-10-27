import { Component, OnInit, inject, signal, computed,AfterViewInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { AccommodationDTO } from '../../models/accommodation.model';
import { CommentListComponent } from '../comment/comment';
import { MapService } from '../../services/map-service';
import { ReservationService } from '../../services/reservation.service';
import { CreateReservationDTO } from '../../models/reservation.model';
import { ReservationDTO } from '../../models/reservation.model';
import { FlatpickrModule } from 'angularx-flatpickr';
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
  private mapInitialized = signal(false);

  


  // Datos del alojamiento
  accommodation = signal<AccommodationDTO | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  reservations = signal<ReservationDTO[]>([]);

  // Datos del formulario de reserva
  checkInDate = signal<string>('');
  checkOutDate = signal<string>('');
  guests = signal<number>(1);

  // Eliminado: Estados del Toast. Usaremos SweetAlert2

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
      Swal.fire('Fechas incompletas', 'Selecciona llegada y salida.', 'warning');
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
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    this.reservationService.create(dto).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: '¡Reserva creada!',
          text: `Tu reserva fue creada exitosamente. Estado: ${res.status}`,
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear reserva',
          text: err.error?.message || 'No se pudo completar la reserva.',
        });
        console.error(err);
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

  // Método para formatear moneda
  private formatCurrency(amount: number): string {
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
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  /** Inicializa Flatpickr con colores */
  private initializeCalendar(): void {
    flatpickr('#calendar', {
      locale: Spanish,
      dateFormat: 'Y-m-d',
      inline: true, // calendario visible siempre
      onDayCreate: (_dObj, _dStr, fp, dayElem) => {
        const date = dayElem.dateObj.toISOString().split('T')[0];
        const status = this.getDateStatus(date);

        if (status === 'pending') {
          dayElem.classList.add('flatpickr-day--pending');
        } else if (status === 'completed') {
          dayElem.classList.add('flatpickr-day--completed');
        }
      },
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          this.checkInDate.set(selectedDates[0].toISOString().split('T')[0]);
        }
      },
    });
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