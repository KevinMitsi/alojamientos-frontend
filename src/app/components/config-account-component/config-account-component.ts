import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-config-account-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-account-component.html',
  styleUrl: './config-account-component.css'
})
export class ConfigAccountComponent {
  showChangePassword = false;

  user: User | null = null;
  userTypeLabel: string = '';
  userDocuments: string[] = [];

  // Contraseña
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: string = '';
  passwordSuccess: string = '';

  // Documentos
  selectedFiles: File[] = [];
  uploadError: string = '';
  uploadSuccess: string = '';


  constructor(private userService: UserService, private authService: AuthService) {
    this.loadUser();
  }

  loadUser() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Usuario recibido:', user);
        this.user = user;
        if (user.roles && user.roles.length > 0) {
          if (user.roles.includes(UserRole.HOST)) {
            this.userTypeLabel = 'HOST';
          } else if (user.roles.includes(UserRole.ADMIN)) {
            this.userTypeLabel = 'ADMIN';
          } else {
            this.userTypeLabel = 'USER';
          }
        } else {
          this.userTypeLabel = 'USER';
        }
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.user = null;
        this.userTypeLabel = '';
        this.userDocuments = [];
      }
    });
  }

  loadDocuments() {
    // Suponiendo que los documentos están en user.documents (ajusta si es diferente)
  this.userDocuments = this.user?.documentsUrl || [];
  }

  onChangePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (!this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Por favor, completa ambos campos.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }
    // Aquí podrías pedir la contraseña actual si lo deseas
    this.userService.changePassword({ currentPassword: '', newPassword: this.newPassword }).subscribe({
      next: () => {
        this.passwordSuccess = 'Contraseña cambiada exitosamente.';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showChangePassword = false;
      },
      error: (err) => {
        this.passwordError = 'Error al cambiar la contraseña.';
      }
    });
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.selectedFiles = Array.from(files);
  }

  onUploadDocuments() {
    this.uploadError = '';
    this.uploadSuccess = '';
    if (!this.selectedFiles.length) return;
    this.userService.uploadDocuments(this.selectedFiles).subscribe({
      next: (docs) => {
        this.uploadSuccess = 'Documentos subidos correctamente.';
        this.selectedFiles = [];
        this.loadUser();
      },
      error: () => {
        this.uploadError = 'Error al subir documentos.';
      }
    });
  }

  onDeleteDocument(index: number) {
    this.userService.deleteDocument(index).subscribe({
      next: () => {
        this.loadUser();
      },
      error: () => {
        // Podrías mostrar un error si lo deseas
      }
    });
  }
}
