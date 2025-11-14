

import { RegisterUserDTO, User } from '../models/user.model';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';




export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  name: string;
  roles: string[];
  isVerified: boolean;
  isHostVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://pavanzada-gestionalojaimientos-production.up.railway.app/api/auth'; // Cambia la URL según tu backend

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password });
  }

  register(registerRequest: RegisterUserDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, registerRequest);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }

  // 🔹 Renovar token JWT
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {});
  }

  // 🔹 Convertirse en HOST
  becomeHost(): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/become-host`, {});
  }
  
}