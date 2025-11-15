import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterUserDTO } from '../../models/user.model';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(100)]],
        phone: ['', [Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
        dateBirth: ['', [Validators.required]],
          password: ['', [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(20),
            Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._-])[A-Za-z\\d@$!%*?&._-]+$')
          ]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  // Validador personalizado
  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Getters para los campos
  get name() { return this.registerForm.get('name'); }
  get phone() { return this.registerForm.get('phone'); }
  get email() { return this.registerForm.get('email'); }
  get dateBirth() { return this.registerForm.get('dateBirth'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  // Envío del formulario
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos correctamente',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const form = this.registerForm.value;
    const rawDate = form.dateBirth;
    let isoDate: string;

    if (!rawDate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Fecha de nacimiento inválida.',
        confirmButtonText: 'Reintentar',
        confirmButtonColor: '#d33'
      });
      return;
    } else if (typeof rawDate === 'string' && rawDate.includes('T')) {
      isoDate = new Date(rawDate).toISOString().slice(0, 10);
    } else if (typeof rawDate === 'string') {
      isoDate = rawDate;
    } else {
      isoDate = (rawDate as Date).toISOString().slice(0, 10);
    }

    const payload: RegisterUserDTO = {
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone || '',
      dateOfBirth: isoDate
    };

    this.loading = true;

    this.authService.register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          console.log('✅ Registro exitoso:', res);
          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Usuario registrado correctamente',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            this.registerForm.reset();
            this.router.navigate(['/login']);
          });
        },
        error: (err) => {
          console.error('❌ Error al registrar:', err);
          let errorTitle = 'Error al registrar';
          let errorMessage = 'Error en el servidor. Intenta más tarde.';
          let errorHtml = '';

          // Si la respuesta es un string plano
          let camposConError: any = null;
          let violaciones: any = null;
          if (typeof err?.error === 'string') {
            errorMessage = err.error;
          } else if (err?.error) {
            // Si es un objeto tipo ResponseErrorDTO
            const backend = err.error;
            if (backend.message) errorMessage = backend.message;

            // Detalles de validación de campos
            if (backend.details) {
              // Campos con error (DTO)
              if (backend.details.camposConError) {
                camposConError = backend.details.camposConError;
                errorHtml += '<ul style="text-align:left">';
                for (const campo in camposConError) {
                  errorHtml += `<li><b>${campo}:</b> ${camposConError[campo]}</li>`;
                }
                errorHtml += '</ul>';
              }
              // Violaciones (params)
              if (backend.details.violaciones) {
                violaciones = backend.details.violaciones;
                errorHtml += '<ul style="text-align:left">';
                for (const campo in violaciones) {
                  errorHtml += `<li><b>${campo}:</b> ${violaciones[campo]}</li>`;
                }
                errorHtml += '</ul>';
              }
              // Detalle simple
              if (backend.details.detalle) {
                errorHtml += `<div style="text-align:left">${backend.details.detalle}</div>`;
              }
            }
          } else if (err?.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor.';
          }

          // Limpiar solo los campos de contraseña si el error es de contraseña
          let limpiarPassword = false;
          if (camposConError && (camposConError['password'] || camposConError['confirmPassword'])) {
            limpiarPassword = true;
          }
          if (violaciones && (violaciones['password'] || violaciones['confirmPassword'])) {
            limpiarPassword = true;
          }
          if (limpiarPassword) {
            this.registerForm.patchValue({ password: '', confirmPassword: '' });
            this.registerForm.get('password')?.markAsPristine();
            this.registerForm.get('confirmPassword')?.markAsPristine();
          }

          Swal.fire({
            icon: 'error',
            title: errorTitle,
            html: `<div style='margin-bottom:8px;'>${errorMessage}</div>${errorHtml}`,
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d33'
          });
        }
      });
  }
}
