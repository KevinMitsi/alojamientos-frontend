import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-accommodation-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './accommodation-card-component.html',
  styleUrl: './accommodation-card-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccommodationCardComponent {
  accommodation = input.required<{ id: number; title: string; pricePerNight: number; avgRating: number; imageUrl: string }>();


 // Método que se ejecuta cuando se hace clic en la card
  openDetail(): void {
    const id = this.accommodation().id;
    // window.open abre una nueva pestaña del navegador
    // El primer parámetro es la URL, el segundo '_blank' indica nueva pestaña
    window.open(`/accommodation/${id}`, '_blank'); 
}


}
