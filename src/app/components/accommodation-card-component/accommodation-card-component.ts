import { Component, ChangeDetectionStrategy, input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { FavoriteService, Favorite } from '../../services/favorite.service';
import { TokenService } from '../../services/token.service';
@Component({
  selector: 'app-accommodation-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './accommodation-card-component.html',
  styleUrl: './accommodation-card-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccommodationCardComponent implements OnInit {
  accommodation = input.required<{ id: number; title: string; pricePerNight: number; avgRating: number; imageUrl: string }>();

  isFavorite = false;
  favoriteId: number | null = null;

  constructor(
    private router: Router,
    private favoriteService: FavoriteService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateFavoriteState();
  }

  updateFavoriteState(): void {
    this.favoriteService.getUserFavorites().subscribe(favs => {
      const found = favs.find(f => f.accommodation.id === this.accommodation().id);
      this.isFavorite = !!found;
      this.favoriteId = found ? found.id : null;
      this.cdr.markForCheck();
    });
  }

  openDetail(): void {
    const id = this.accommodation().id;
    this.router.navigate(['/accommodation', id]);
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.tokenService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.isFavorite && this.favoriteId) {
      this.favoriteService.removeFavorite(this.favoriteId).subscribe(() => {
        this.updateFavoriteState();
      });
    } else {
      this.favoriteService.addFavorite(this.accommodation().id).subscribe(() => {
        this.updateFavoriteState();
      });
    }
  }
}
