import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../search-bar-component/search-bar-component';
import { AccommodationCardComponent } from '../accommodation-card-component/accommodation-card-component';
import { AccommodationService } from '../../services/accommodation';
import { AccommodationSearchCriteria } from '../../models/accommodation.model';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, AccommodationCardComponent],
  templateUrl: './mainpage.html',
  styleUrl: './mainpage.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPage {
  private accommodationService = inject(AccommodationService);
  accommodations = signal<{ id: number; title: string; pricePerNight: number; avgRating: number; imageUrl: string }[]>([]);
  loading = signal(false);

  onSearch(criteria: { city: string; startDate: string; endDate: string; guests: number }) {
    this.loading.set(true);

      const searchCriteria: AccommodationSearchCriteria = {} as AccommodationSearchCriteria;
      const parsedCity = Number(criteria.city);
      if (!Number.isNaN(parsedCity) && parsedCity > 0) {
        searchCriteria.cityId = parsedCity;
      }
      if (criteria.startDate) searchCriteria.startDate = criteria.startDate;
      if (criteria.endDate) searchCriteria.endDate = criteria.endDate;
      if (typeof criteria.guests === 'number' && criteria.guests > 0) searchCriteria.guests = criteria.guests;

    this.accommodationService.search(searchCriteria, 0, 10)
      .subscribe({
        next: (response) => {
          this.accommodations.set(
            response.content.map(accommodation => ({
              id: accommodation.id,
              title: accommodation.title,
              pricePerNight: accommodation.pricePerNight ?? 0,
              avgRating: accommodation.avgRating,
              imageUrl: accommodation.primaryImageUrl ?? 'https://placehold.co/400x300/e0e0e0/757575?text=Sin+Imagen'
            }))
          );
        },
        error: (error) => {
          console.error('Error al buscar alojamientos:', error);
          this.accommodations.set([]);
        },
        complete: () => this.loading.set(false)
      });
  }
}
