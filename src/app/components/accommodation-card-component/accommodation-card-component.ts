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
  accommodation = input.required<{ title: string; pricePerNight: number; avgRating: number; imageUrl: string }>();
}
