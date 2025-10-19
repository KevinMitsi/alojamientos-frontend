import { Component, ChangeDetectionStrategy, computed, signal, inject, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccommodationService } from '../../services/accommodation';

// Lista de servicios disponibles
export interface ServiceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar-component.html',
  styleUrl: './search-bar-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accommodationService = inject(AccommodationService);

  // Control para mostrar/ocultar búsqueda avanzada
  showAdvancedSearch = signal(false);

  form = this.fb.nonNullable.group({
    city: [''],
    startDate: [''],
    endDate: [''],
    guests: [1],
    // Campos de búsqueda avanzada
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    services: [[] as string[]]
  });

  // Lista de servicios disponibles - ahora es un signal
  availableServices = signal<ServiceOption[]>([]);

  criteria = signal(this.form.value);
  criteriaDisplay = computed(() => `${this.criteria().city} ${this.criteria().startDate} - ${this.criteria().endDate}`);

  onSearch = output<{
    city: string;
    startDate: string;
    endDate: string;
    guests: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    services?: string[];
  }>();

  ngOnInit(): void {
    // Cargar servicios al inicializar el componente
    this.loadServices();
  }

  loadServices(): void {
    this.accommodationService.getAvailableServices().subscribe({
      next: (services) => {
        // Convertir array de strings a ServiceOption[]
        const serviceOptions = services.map(service => ({
          value: service,
          label: service
        }));
        this.availableServices.set(serviceOptions);
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        // En caso de error, usar una lista vacía o valores por defecto
        this.availableServices.set([]);
      }
    });
  }

  // Fecha mínima (hoy)
  get minDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update(value => !value);
  }

  toggleService(serviceValue: string): void {
    const currentServices = this.form.value.services || [];
    const index = currentServices.indexOf(serviceValue);
    
    if (index > -1) {
      // Remover el servicio
      const newServices = currentServices.filter(s => s !== serviceValue);
      this.form.patchValue({ services: newServices });
    } else {
      // Agregar el servicio
      this.form.patchValue({ services: [...currentServices, serviceValue] });
    }
  }

  isServiceSelected(serviceValue: string): boolean {
    const services = this.form.value.services || [];
    return services.includes(serviceValue);
  }

  clearAdvancedFilters(): void {
    this.form.patchValue({
      minPrice: null,
      maxPrice: null,
      services: []
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.onSearch.emit(this.form.getRawValue());
    }
  }
}
