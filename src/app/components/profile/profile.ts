// src/app/pages/profile/profile.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { User, EditUser } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  user: User | null = null;
  editMode = false;
  editData: EditUser = { name: '', phone: '', birthYear: 0, description: '' };
  selectedFile: File | null = null;

 ngOnInit(): void {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    Swal.fire('Error', 'Debes iniciar sesión para ver tu perfil.', 'error');
    return;
  }

  this.loadUserData();
}


  loadUserData(): void {
  this.userService.getCurrentUser().subscribe({
    next: (data) => {
      this.user = data;
      this.editData = {
        name: data.name,
        phone: data.phone,
        birthYear: new Date(data.dateOfBirth).getFullYear(),
        description: data.description
      };
    },
    error: (err) => {
      console.error('Error cargando datos del usuario:', err);
      Swal.fire('Error', 'No se pudieron cargar los datos del usuario', 'error');
    }
  });
}


  enableEdit(): void {
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.loadUserData();
  }

  saveChanges(): void {
    if (!this.editData.name || !this.editData.phone || !this.editData.birthYear) {
      Swal.fire('Atención', 'Por favor, completa todos los campos obligatorios.', 'warning');
      return;
    }

    this.userService.editProfile(this.editData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.editMode = false;
        Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo actualizar el perfil', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.userService.uploadProfileImage(this.selectedFile).subscribe({
      next: (url) => {
        if (this.user) this.user.profileImageUrl = url;
        Swal.fire('Éxito', 'Foto de perfil actualizada', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo subir la imagen', 'error')
    });
  }
}
