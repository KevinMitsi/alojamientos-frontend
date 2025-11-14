import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Favorite {
  id: number;
  userId: number;
  accommodation: {
    id: number;
    title: string;
    pricePerNight: number;
    avgRating: number;
    images: { url: string; thumbnailUrl: string; isPrimary: boolean }[];
  };
}

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private baseUrl = 'https://pavanzada-gestionalojaimientos-production.up.railway.app/api/favorites';

  constructor(private http: HttpClient) {}

  getUserFavorites(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.baseUrl}/user/me`);
  }

  addFavorite(accommodationId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.baseUrl}/${accommodationId}`, {});
  }

  removeFavorite(favoriteId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${favoriteId}`);
  }
}
