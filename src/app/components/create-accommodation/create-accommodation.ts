import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AccommodationService } from '../../services/accommodation.service';
import { CreateAccommodationDTO, CoordinatesDTO } from '../../models/accommodation.model';

@Component({
  selector: 'app-create-accommodation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-accommodation.html',
  styleUrl: './create-accommodation.css'
})
export class CreateAccommodation implements OnInit {
  private readonly accommodationService = inject(AccommodationService);
  private readonly router = inject(Router);

  // Lista de servicios disponibles
  availableServices: string[] = [];
  selectedServices: string[] = [];

  // Formulario
  accommodationForm: CreateAccommodationDTO = {
    title: '',
    description: '',
    city: 0,
    coordinates: { lat: 0, lng: 0 },
    address: '',
    pricePerNight: 0,
    services: [],
    maxGuests: 1
  };

  // Estados
  isLoading = false;
  isSubmitting = false;

  // Lista de ciudades (hardcoded por ahora - podrías crear un servicio)
  cities = [
    { id: 1, name: 'Bogotá' },
    { id: 2, name: 'Medellín' },
    { id: 3, name: 'Cali' },
    { id: 4, name: 'Barranquilla' },
    { id: 5, name: 'Cartagena' },
    { id: 6, name: 'Bucaramanga' },
    { id: 7, name: 'Pereira' },
    { id: 8, name: 'Santa Marta' },
    { id: 9, name: 'Manizales' },
    { id: 10, name: 'Cúcuta' }
  ];

  ngOnInit(): void {
    this.loadAvailableServices();
  }

  loadAvailableServices(): void {
    this.isLoading = true;
    this.accommodationService.getAvailableServices().subscribe({
      next: (services) => {
        this.availableServices = services;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        // Servicios por defecto si falla la carga
        this.availableServices = [
          'WiFi', 'Piscina', 'Aire Acondicionado', 'Cocina', 
          'Estacionamiento', 'TV', 'Lavadora', 'Gimnasio'
        ];
        this.isLoading = false;
      }
    });
  }

  toggleService(service: string): void {
    const index = this.selectedServices.indexOf(service);
    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(service);
    }
  }

  isServiceSelected(service: string): boolean {
    return this.selectedServices.includes(service);
  }

  onSubmit(): void {
    // Validaciones
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Preparar DTO
    const dto: CreateAccommodationDTO = {
      ...this.accommodationForm,
      services: this.selectedServices
    };

    this.accommodationService.create(dto).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Alojamiento creado!',
          text: `${response.title} ha sido creado exitosamente`,
          confirmButtonText: 'Ver mis alojamientos'
        }).then(() => {
          this.router.navigate(['/mis-alojamientos']);
        });
      },
      error: (error) => {
        console.error('Error al crear alojamiento:', error);
        this.isSubmitting = false;
        
        let errorMessage = 'No se pudo crear el alojamiento';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.details) {
          const details = error.error.details;
          if (details.camposConError) {
            errorMessage = Object.values(details.camposConError).join(', ');
          }
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage
        });
      }
    });
  }

  validateForm(): boolean {
    if (!this.accommodationForm.title || this.accommodationForm.title.trim().length < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Título inválido',
        text: 'El título debe tener al menos 5 caracteres'
      });
      return false;
    }

    if (!this.accommodationForm.description || this.accommodationForm.description.trim().length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Descripción inválida',
        text: 'La descripción debe tener al menos 10 caracteres'
      });
      return false;
    }

    if (!this.accommodationForm.city || this.accommodationForm.city === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Ciudad requerida',
        text: 'Por favor selecciona una ciudad'
      });
      return false;
    }

    if (!this.accommodationForm.address || this.accommodationForm.address.trim().length < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Dirección inválida',
        text: 'La dirección debe tener al menos 5 caracteres'
      });
      return false;
    }

    if (!this.accommodationForm.pricePerNight || this.accommodationForm.pricePerNight <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio debe ser mayor a 0'
      });
      return false;
    }

    if (!this.accommodationForm.maxGuests || this.accommodationForm.maxGuests < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Huéspedes inválido',
        text: 'Debe permitir al menos 1 huésped'
      });
      return false;
    }

    if (!this.accommodationForm.coordinates.lat || !this.accommodationForm.coordinates.lng) {
      Swal.fire({
        icon: 'warning',
        title: 'Coordenadas requeridas',
        text: 'Por favor ingresa las coordenadas del alojamiento'
      });
      return false;
    }

    return true;
  }

  cancel(): void {
    Swal.fire({
      title: '¿Cancelar creación?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/mis-alojamientos']);
      }
    });
  }
}
