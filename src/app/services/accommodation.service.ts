import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccommodationDTO,
  AccommodationFoundDTO,
  CreateAccommodationDTO,
  CreateAccommodationResponseDTO,
  UpdateAccommodationDTO,
  AccommodationSearchCriteria,
  AccommodationMetrics,
  PageResponse
} from '../models/accommodation.model';

@Injectable({
  providedIn: 'root'
})
export class AccommodationService {
  private readonly http = inject(HttpClient);
  // Usa ruta relativa '/api' si tienes proxy configurado, o 'https://pavanzada-gestionalojaimientos-production.up.railway.app/api' directo
  private readonly baseUrl = 'https://pavanzada-gestionalojaimientos-production.up.railway.app/api/accommodations';
  
  /**
   * Crear un nuevo alojamiento (requiere autenticación y rol HOST)
   */
  create(dto: CreateAccommodationDTO): Observable<CreateAccommodationResponseDTO> {
    return this.http.post<CreateAccommodationResponseDTO>(this.baseUrl, dto);
  }

  /**
   * Actualizar un alojamiento existente (requiere autenticación y ser propietario)
   */
  update(accommodationId: number, dto: UpdateAccommodationDTO): Observable<AccommodationDTO> {
    return this.http.put<AccommodationDTO>(`${this.baseUrl}/${accommodationId}`, dto);
  }

  /**
   * Buscar alojamientos con criterios y paginación (público)
   * @param criteria - todos los filtros son opcionales
   * @returns Resultados ligeros con AccommodationFoundDTO
   */
  search(
    criteria: AccommodationSearchCriteria,
    page: number = 0,
    size: number = 10,
    sort?: string
  ): Observable<PageResponse<AccommodationFoundDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Solo incluir filtros cuando tengan valores válidos
    if (criteria.cityName && criteria.cityName.trim() !== '') {
      params = params.set('cityName', criteria.cityName.trim());
    }

    if (criteria.startDate) {
      params = params.set('startDate', criteria.startDate);
    }
    if (criteria.endDate) {
      params = params.set('endDate', criteria.endDate);
    }
    if (typeof criteria.guests === 'number' && Number.isFinite(criteria.guests) && criteria.guests > 0) {
      params = params.set('guests', criteria.guests.toString());
    }
    if (typeof criteria.minPrice === 'number' && Number.isFinite(criteria.minPrice)) {
      params = params.set('minPrice', criteria.minPrice.toString());
    }
    if (typeof criteria.maxPrice === 'number' && Number.isFinite(criteria.maxPrice)) {
      params = params.set('maxPrice', criteria.maxPrice.toString());
    }
    if (criteria.services && criteria.services.length > 0) {
      criteria.services.forEach(service => {
        params = params.append('services', service);
      });
    }
    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<PageResponse<AccommodationFoundDTO>>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Eliminar un alojamiento (soft delete) (requiere autenticación y ser propietario)
   */
  delete(accommodationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${accommodationId}`);
  }

  /**
   * Obtener todos los alojamientos del host autenticado (requiere autenticación y rol HOST)
   */
  findByHost(page: number = 0, size: number = 10): Observable<PageResponse<AccommodationDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<AccommodationDTO>>(`${this.baseUrl}/host/me`, { params });
  }

  /**
   * Subir imágenes a un alojamiento (requiere autenticación y ser propietario)
   */
  uploadImages(
    accommodationId: number,
    imageFiles: File[],
    primary: boolean = false
  ): Observable<string[]> {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    formData.append('primary', primary.toString());

    return this.http.post<string[]>(
      `${this.baseUrl}/${accommodationId}/images/upload`,
      formData
    );
  }

  /**
   * Eliminar una imagen de un alojamiento (requiere autenticación y ser propietario)
   */
  deleteImage(accommodationId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${accommodationId}/images/${imageId}`);
  }

  /**
   * Obtener métricas de un alojamiento (público)
   */
  getMetrics(
    accommodationId: number,
    startDate?: string,
    endDate?: string
  ): Observable<AccommodationMetrics> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start', startDate);
    }
    if (endDate) {
      params = params.set('end', endDate);
    }

    return this.http.get<AccommodationMetrics>(
      `${this.baseUrl}/${accommodationId}/metrics`,
      { params }
    );
  }

  /**
   * Obtener un alojamiento por ID (público)
   */
  findById(accommodationId: number): Observable<AccommodationDTO> {
    return this.http.get<AccommodationDTO>(`${this.baseUrl}/${accommodationId}`);
  }

  /**
   * Obtener todos los servicios disponibles (público)
   */
  getAvailableServices(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/services`);
  }
}
