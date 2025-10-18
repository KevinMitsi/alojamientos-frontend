import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AccommodationService } from '../../services/accommodation';
import { AccommodationDTO } from '../../models/accommodation.model';
import { CommentListComponent } from '../comment/comment';

@Component({
  selector: 'app-accommodation-detail',
  standalone: true,
  imports: [CommonModule, CommentListComponent],
  templateUrl: './accommodation-detail-component.html',
  styleUrl: './accommodation-detail-component.css'
})
export class AccommodationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private accommodationService = inject(AccommodationService);

  // Datos del alojamiento
  accommodation = signal<AccommodationDTO | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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
    if (!this.checkInDate() || !this.checkOutDate()) return 0;

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
          // Inicializar huéspedes con 1, pero no más de la capacidad máxima
          this.guests.set(Math.min(1, data.maxGuests));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar alojamiento:', err);
          this.error.set('No se pudo cargar el alojamiento. Por favor, intenta de nuevo.');
          this.loading.set(false);
        }
      });
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
    if (!acc || !this.checkInDate() || !this.checkOutDate()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    if (this.totalNights() < 1) {
      alert('La reserva debe ser de al menos 1 noche');
      return;
    }

    // Aquí puedes implementar la lógica de reserva
    const reservationData = {
      accommodationId: acc.id,
      checkIn: this.checkInDate(),
      checkOut: this.checkOutDate(),
      guests: this.guests(),
      totalNights: this.totalNights(),
      totalPrice: this.totalPrice()
    };

    console.log('Datos de reserva:', reservationData);
    alert(`Reserva confirmada!\n\nAlojamiento: ${acc.title}\nCheck-in: ${this.checkInDate()}\nCheck-out: ${this.checkOutDate()}\nHuéspedes: ${this.guests()}\nNoches: ${this.totalNights()}\nTotal: ${this.totalPrice()} COP`);
  }
}