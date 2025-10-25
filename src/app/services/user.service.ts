// src/app/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EditUser, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/users';
  private readonly authUrl = 'http://localhost:8080/api/auth';

  // 🔹 Obtener usuario autenticado (al cargar perfil)
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.authUrl}/me`);
  }

  // 🔹 Editar perfil
  editProfile(editUser: EditUser): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}`, editUser);
  }

  // 🔹 Subir imagen de perfil
  uploadProfileImage(image: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.baseUrl}/profile-image`, formData, { responseType: 'text' });
  }

  // 🔹 Eliminar imagen de perfil
  deleteProfileImage(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profile-image`);
  }
}
