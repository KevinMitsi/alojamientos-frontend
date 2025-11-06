// ...existing code...
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { AccommodationService } from '../../services/accommodation.service';
import { 
  AccommodationDTO, 
  UpdateAccommodationDTO, 
  CoordinatesDTO,
  ImageDTO 
} from '../../models/accommodation.model';

@Component({
  selector: 'app-edit-accommodation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-accommodation.html',
  styleUrl: './edit-accommodation.css'
})
export class EditAccommodation implements OnInit {
  // Métodos trackBy para *ngFor
  trackByImageId(index: number, image: any): any {
    return image.id;
  }

  trackByUrl(index: number, url: string): any {
    return url;
  }

  trackByService(index: number, service: string): any {
    return service;
  }
  private readonly accommodationService = inject(AccommodationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // ID del alojamiento

  accommodationId: number = 0;

  // Datos del alojamiento
  accommodation: AccommodationDTO = {
    id: 0,
    hostId: 0,
    title: '',
    description: '',
    city: { id: 0, name: '' },
    address: '',
    coordinates: { lat: 0, lng: 0 },
    pricePerNight: 0,
    services: [],
    images: [],
    maxGuests: 1,
    active: true,
    softDeleted: false,
    deletedAt: null,
    createdAt: '',
    updatedAt: '',
    countReservations: 0,
    avgRating: 0
  };

  // Lista de servicios disponibles
  availableServices: string[] = [];
  selectedServices: string[] = [];

  // Formulario de edición
  editForm: UpdateAccommodationDTO = {
    title: '',
    description: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    pricePerNight: 0,
    services: [],
    maxGuests: 1,
    active: true
  };

  // Gestión de imágenes
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isPrimaryImage = false;

  // Estados
  isLoading = true;
  isSubmitting = false;
  isUploadingImages = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.accommodationId = idParam ? Number(idParam) : 0;
    if (!this.accommodationId || isNaN(this.accommodationId)) {
      Swal.fire({
        icon: 'error',
        title: 'ID inválido',
        text: 'No se pudo identificar el alojamiento'
      }).then(() => {
        this.router.navigate(['/mis-alojamientos']);
      });
      return;
    }
    this.loadAccommodation();
    this.loadAvailableServices();
  }

  loadAccommodation(): void {
    this.accommodationService.findById(this.accommodationId).subscribe({
      next: (accommodation) => {
        this.accommodation = accommodation ?? this.accommodation;
        // Cargar datos en el formulario
        this.editForm = {
          title: accommodation?.title ?? '',
          description: accommodation?.description ?? '',
          address: accommodation?.address ?? '',
          coordinates: { ...accommodation?.coordinates ?? { lat: 0, lng: 0 } },
          pricePerNight: accommodation?.pricePerNight ?? 0,
          services: [...(accommodation?.services ?? [])],
          maxGuests: accommodation?.maxGuests ?? 1,
          active: accommodation?.active ?? true
        };
        this.selectedServices = [...(accommodation?.services ?? [])];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar alojamiento:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el alojamiento'
        }).then(() => {
          this.router.navigate(['/mis-alojamientos']);
        });
      }
    });
  }

  loadAvailableServices(): void {
    this.accommodationService.getAvailableServices().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        // Servicios por defecto
        this.availableServices = [
          'WiFi', 'Piscina', 'Aire Acondicionado', 'Cocina', 
          'Estacionamiento', 'TV', 'Lavadora', 'Gimnasio'
        ];
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

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      
      // Generar previews
      this.previewUrls = [];
      this.selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.previewUrls = [];
    this.isPrimaryImage = false;
  }

  uploadImages(): void {
    if (this.selectedFiles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivos',
        text: 'Por favor selecciona al menos una imagen'
      });
      return;
    }

    this.isUploadingImages = true;

    this.accommodationService.uploadImages(
      this.accommodationId, 
      this.selectedFiles, 
      this.isPrimaryImage
    ).subscribe({
      next: (urls) => {
        Swal.fire({
          icon: 'success',
          title: 'Imágenes subidas',
          text: `Se subieron ${urls.length} imagen(es) correctamente`
        });
        
        this.clearSelectedFiles();
        this.isUploadingImages = false;
        this.loadAccommodation(); // Recargar para mostrar nuevas imágenes
      },
      error: (error) => {
        console.error('Error al subir imágenes:', error);
        this.isUploadingImages = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudieron subir las imágenes'
        });
      }
    });
  }

  deleteImage(imageId: number): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.accommodationService.deleteImage(this.accommodationId, imageId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Imagen eliminada',
              text: 'La imagen ha sido eliminada correctamente'
            });
            
            this.loadAccommodation(); // Recargar para actualizar lista
          },
          error: (error) => {
            console.error('Error al eliminar imagen:', error);
            
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la imagen'
            });
          }
        });
      }
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Preparar DTO
    const dto: UpdateAccommodationDTO = {
      ...this.editForm,
      services: this.selectedServices
    };

    this.accommodationService.update(this.accommodationId, dto).subscribe({
      next: (updated) => {
        Swal.fire({
          icon: 'success',
          title: 'Alojamiento actualizado',
          text: 'Los cambios se guardaron correctamente',
          confirmButtonText: 'Ver mis alojamientos'
        }).then(() => {
          this.router.navigate(['/mis-alojamientos']);
        });
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.isSubmitting = false;
        
        let errorMessage = 'No se pudo actualizar el alojamiento';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.details?.camposConError) {
          errorMessage = Object.values(error.error.details.camposConError).join(', ');
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
    if (!this.editForm.title || this.editForm.title.trim().length < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Título inválido',
        text: 'El título debe tener al menos 5 caracteres'
      });
      return false;
    }

    if (!this.editForm.description || this.editForm.description.trim().length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Descripción inválida',
        text: 'La descripción debe tener al menos 10 caracteres'
      });
      return false;
    }

    if (!this.editForm.address || this.editForm.address.trim().length < 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Dirección inválida',
        text: 'La dirección debe tener al menos 5 caracteres'
      });
      return false;
    }

    if (!this.editForm.pricePerNight || this.editForm.pricePerNight <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio debe ser mayor a 0'
      });
      return false;
    }

    if (!this.editForm.maxGuests || this.editForm.maxGuests < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Huéspedes inválido',
        text: 'Debe permitir al menos 1 huésped'
      });
      return false;
    }

    return true;
  }

  cancel(): void {
    Swal.fire({
      title: '¿Descartar cambios?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/mis-alojamientos']);
      }
    });
  }
}
