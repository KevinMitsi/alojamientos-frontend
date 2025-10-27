import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateReservationDTO,
  ReservationDTO,
  ReservationStatus,
  ReservationSearchCriteria,
} from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/reservations';

  /**
   * Crear nueva reserva (requiere autenticación y rol USER)
   */
  create(dto: CreateReservationDTO): Observable<ReservationDTO> {
    return this.http.post<ReservationDTO>(this.baseUrl, dto);
  }

  /**
   * Buscar reserva por ID
   */
  findById(reservationId: number): Observable<ReservationDTO> {
    return this.http.get<ReservationDTO>(`${this.baseUrl}/${reservationId}`);
  }

  /**
   * Buscar reservas del usuario actual autenticado
   */
  findByUser(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get(`${this.baseUrl}/user/me`, { params });
  }

  /**
   * Cancelar una reserva
   */
  cancel(reservationId: number, motivo: string): Observable<void> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http.put<void>(`${this.baseUrl}/${reservationId}/cancel`, null, {
      params,
    });
  }

  /**
   * Actualizar el estado (solo HOST)
   */
  updateStatus(
    reservationId: number,
    status: ReservationStatus
  ): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.put<void>(`${this.baseUrl}/${reservationId}/status`, null, {
      params,
    });
  }

getByAccommodation(accommodationId: number): Observable<ReservationDTO[]> {
  return this.http.get<ReservationDTO[]>(
    `${this.baseUrl}/accommodation/${accommodationId}`
  );
}


}
