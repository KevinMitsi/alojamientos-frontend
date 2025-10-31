// src/app/services/mercadopago.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MercadoPagoPreferenceResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/mercadopago';

  /**
   * Crear preferencia de pago en MercadoPago
   * @param reservationId - ID de la reserva a pagar
   * @returns URL de pago de MercadoPago
   */
  createPreference(reservationId: number): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/create-preference/${reservationId}`,
      {},
      { responseType: 'text' as 'json' }
    );
  }

  /**
   * Confirmar pago después de éxito en MercadoPago
   * @param reservationId - ID de la reserva
   * @param status - Estado del pago
   */
  confirmPayment(reservationId: number, status: string): Observable<string> {
    const params = new HttpParams().set('status', status);
    
    return this.http.post<string>(
      `${this.baseUrl}/confirm/${reservationId}`,
      {},
      { 
        params,
        responseType: 'text' as 'json' 
      }
    );
  }
}