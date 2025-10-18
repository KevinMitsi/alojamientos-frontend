import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
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

constructor(private router: Router) {}

 // Método que se ejecuta cuando se hace clic en la card
  openDetail(): void {
   const id = this.accommodation().id;
    this.router.navigate(['/accommodation', id]);
}


}
