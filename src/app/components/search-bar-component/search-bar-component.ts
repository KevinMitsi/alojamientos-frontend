import { Component, ChangeDetectionStrategy, computed, signal, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
export class SearchBarComponent {
  private fb = inject(FormBuilder);

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

  // Lista de servicios disponibles
  availableServices: ServiceOption[] = [
    { value: 'WIFI', label: 'WiFi' },
    { value: 'PARKING', label: 'Estacionamiento' },
    { value: 'POOL', label: 'Piscina' },
    { value: 'GYM', label: 'Gimnasio' },
    { value: 'BREAKFAST', label: 'Desayuno' },
    { value: 'AIR_CONDITIONING', label: 'Aire Acondicionado' },
    { value: 'KITCHEN', label: 'Cocina' },
    { value: 'PETS_ALLOWED', label: 'Se aceptan mascotas' },
    { value: 'TV', label: 'TV' },
    { value: 'WASHING_MACHINE', label: 'Lavadora' }
  ];

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
