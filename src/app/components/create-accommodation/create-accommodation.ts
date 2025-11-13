import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AccommodationService } from '../../services/accommodation.service';
import { CreateAccommodationDTO, CoordinatesDTO } from '../../models/accommodation.model';
import { MapService } from '../../services/map-service';

@Component({
  selector: 'app-create-accommodation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-accommodation.html',
  styleUrl: './create-accommodation.css'
})
export class CreateAccommodation implements OnInit, AfterViewInit, OnDestroy {
  private readonly accommodationService = inject(AccommodationService);
  private readonly router = inject(Router);
  private readonly mapService = inject(MapService);

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
  mapInitialized = false;
  selectedCoordinates = signal<CoordinatesDTO | null>(null);

  // Lista de ciudades con coordenadas
  cities = [
    { id: 1, name: 'Bogotá', lat: 4.60971, lng: -74.08175 },
    { id: 2, name: 'Medellín', lat: 6.25184, lng: -75.56359 },
    { id: 3, name: 'Cali', lat: 3.43722, lng: -76.5225 },
    { id: 4, name: 'Barranquilla', lat: 10.96854, lng: -74.78132 },
    { id: 5, name: 'Cartagena', lat: 10.39972, lng: -75.51444 },
    { id: 6, name: 'Bucaramanga', lat: 7.12539, lng: -73.1198 },
    { id: 7, name: 'Pereira', lat: 4.81333, lng: -75.69611 },
    { id: 8, name: 'Santa Marta', lat: 11.24079, lng: -74.19904 },
    { id: 9, name: 'Manizales', lat: 5.07, lng: -75.52 },
    { id: 10, name: 'Cúcuta', lat: 7.88939, lng: -72.49839 }
  ];

  ngOnInit(): void {
    this.loadAvailableServices();
  }

  ngAfterViewInit(): void {
    // Inicializar el mapa después de que la vista esté lista
    this.initializeMap();
  }

  ngOnDestroy(): void {
    // Limpiar el mapa al destruir el componente
    if (this.mapService.mapInstance) {
      this.mapService.clearMarkers();
    }
  }

  initializeMap(): void {
    setTimeout(() => {
      const defaultCoordinates: CoordinatesDTO = { lat: 4.60971, lng: -74.08175 };
      this.mapService.create('map-create', defaultCoordinates, 12);

      const mapInstance = this.mapService.mapInstance;
      if (mapInstance) {
        mapInstance.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;

          this.selectedCoordinates.set({ lat, lng });
          this.accommodationForm = {
            ...this.accommodationForm,
            coordinates: { lat, lng }
          };

          this.mapService.clearMarkers();
          this.mapService.addMarker(
            { lat, lng },
            'Ubicación seleccionada',
            `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
          );
        });
        this.mapInitialized = true;
      }
    }, 100);
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

  onCityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const cityId = Number(select.value);
    
    if (cityId && cityId > 0) {
      const selectedCity = this.cities.find(c => c.id === cityId);
      
      if (selectedCity && this.mapService.mapInstance) {
        // Centrar el mapa en la ciudad seleccionada
        this.mapService.mapInstance.flyTo({
          center: [selectedCity.lng, selectedCity.lat],
          zoom: 13,
          duration: 1500
        });
      }
    }
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
        title: 'Ubicación requerida',
        text: 'Por favor selecciona la ubicación en el mapa haciendo clic sobre él'
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
