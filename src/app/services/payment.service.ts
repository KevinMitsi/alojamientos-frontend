// src/app/services/payment.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentDTO } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/payments';

  /**
   * Registrar un pago
   */
  register(dto: PaymentDTO): Observable<PaymentDTO> {
    return this.http.post<PaymentDTO>(this.baseUrl, dto);
  }

  /**
   * Obtener un pago por ID
   */
  findById(id: number): Observable<PaymentDTO> {
    return this.http.get<PaymentDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener pagos de una reserva
   */
  findByReservation(reservationId: number): Observable<PaymentDTO[]> {
    return this.http.get<PaymentDTO[]>(`${this.baseUrl}/reservation/${reservationId}`);
  }

  /**
   * Confirmar un pago
   */
  confirmPayment(id: number): Observable<PaymentDTO> {
    return this.http.put<PaymentDTO>(`${this.baseUrl}/${id}/confirm`, {});
  }
}