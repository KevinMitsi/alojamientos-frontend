import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css'
})
export class ChangePassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  token: string = '';
  loading = false;
  submitted = false;

  form: FormGroup = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(20),
      this.passwordValidator
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    // Obtener el token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se encontró el código de recuperación. Por favor solicita uno nuevo.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#d33'
        }).then(() => {
          this.router.navigate(['/password-recovery']);
        });
      }
    });
  }

  // Validador personalizado para la contraseña
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&._-]/.test(value);

    const valid = hasUpperCase && hasNumber && hasSpecialChar;

    if (!valid) {
      return { 
        passwordStrength: {
          hasUpperCase,
          hasNumber,
          hasSpecialChar
        }
      };
    }

    return null;
  }

  // Validador para verificar que las contraseñas coincidan
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  resetPassword() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos correctamente',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.loading = true;
    const { newPassword } = this.form.value;

    this.passwordResetService.resetPassword({ 
      token: this.token, 
      newPassword 
    }).subscribe({
      next: (res) => {
        this.loading = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Contraseña cambiada!',
          text: 'Tu contraseña ha sido actualizada exitosamente',
          confirmButtonText: 'Ir al inicio de sesión',
          confirmButtonColor: '#28a745'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.loading = false;
        
        const errorMessage = err?.error?.message || err?.error || 'Error al cambiar la contraseña. El código puede ser inválido o haber expirado.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
