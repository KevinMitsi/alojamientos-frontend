import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-config-account-component',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './config-account-component.html',
  styleUrl: './config-account-component.css'
})
export class ConfigAccountComponent {
  showChangePassword = false;

  user: User | null = null;
  userTypeLabel: string = '';
  userDocuments: string[] = [];

  // Contraseña
  passwordForm: FormGroup;
  passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
  passwordError: string = '';
  passwordSuccess: string = '';

  // Documentos
  selectedFiles: File[] = [];
  uploadError: string = '';
  uploadSuccess: string = '';


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
        Validators.pattern(this.passwordPattern)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
    this.loadUser();
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  loadUser() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.user = null;
        this.userTypeLabel = '';
        this.userDocuments = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadDocuments() {

  this.userDocuments = this.user?.documentsUrl || [];
  }

  async onChangePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (this.passwordForm.invalid) {
      this.passwordError = 'Por favor, corrige los errores en el formulario.';
      this.passwordForm.markAllAsTouched();
      return;
    }
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cambiar tu contraseña?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
  const currentPassword = this.passwordForm.get('currentPassword')?.value;
  const newPassword = this.passwordForm.get('newPassword')?.value;
      this.userService.changePassword({ currentPassword, newPassword }).subscribe({
        next: async (response) => {
          this.passwordSuccess = 'Contraseña cambiada exitosamente.';
          this.passwordForm.reset();
          this.showChangePassword = false;
          await Swal.fire({
            icon: 'success',
            title: '¡Contraseña cambiada!',
            text: typeof response === 'string' ? response : 'Tu contraseña fue actualizada correctamente.',
            confirmButtonText: 'Aceptar'
          });
        },
        error: async (err) => {
          this.passwordError = 'Error al cambiar la contraseña.';
          await Swal.fire({
            icon: 'error',
            title: 'Error al cambiar la contraseña',
            text: (typeof err?.error === 'string' && err?.error) ? err.error : (err?.error?.message || 'Hubo un problema al actualizar la contraseña. Verifica la contraseña actual e inténtalo de nuevo.'),
            confirmButtonText: 'Cerrar'
          });
        }
      });
    }
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

    onBecomeHost() {
      if (!this.user) return;
      this.authService.becomeHost().subscribe({
        next: () => {
          this.loadUser();
          Swal.fire({
            icon: 'success',
            title: '¡Felicidades! 🎉',
            text: 'Ahora eres HOST. Puedes publicar alojamientos.',
            confirmButtonText: 'Aceptar',
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo convertir a HOST. Intenta de nuevo.',
            confirmButtonText: 'Cerrar',
          });
        }
      });
    }
}
