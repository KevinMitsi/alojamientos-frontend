import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PasswordResetRequestDTO, PasswordResetDto } from '../models/password-reset.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/password-reset';

  requestReset(dto: PasswordResetRequestDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/request`, dto, { responseType: 'text' });
  }

  resetPassword(dto: PasswordResetDto): Observable<string> {
    return this.http.put(`${this.baseUrl}`, dto, { responseType: 'text' });
  }
}
