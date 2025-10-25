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

  // Toast (notificación)
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage = '';
  private submittedSuccessfully = false; // evita repetir onSubmit tras éxito

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
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
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

  // Mostrar toast (notificación)
  showToastMessage(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  // Envío del formulario
  onSubmit(): void {
    if (this.submittedSuccessfully) return; // evita doble ejecución

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showToastMessage('error', 'Por favor completa los campos correctamente.');
      return;
    }

    const form = this.registerForm.value;
    const rawDate = form.dateBirth;
    let isoDate: string;

    if (!rawDate) {
      this.showToastMessage('error', 'Fecha de nacimiento inválida.');
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
          this.submittedSuccessfully = true;

          this.showToastMessage('success', '¡Usuario registrado exitosamente!');

          // Limpiar el formulario antes de redirigir
          this.registerForm.reset();

          // Esperar a que se vea el mensaje y luego redirigir
          setTimeout(() => {
            this.showToast = false;
            this.router.navigate(['/login']);
          }, 2500);
        },
        error: (err) => {
          console.error('❌ Error al registrar:', err);
          let msg = 'Error en el servidor. Intenta más tarde.';

          if (err?.status === 400 || err?.status === 422) {
            if (err.error) {
              if (typeof err.error === 'string') msg = err.error;
              else if (err.error.message) msg = err.error.message;
              else if (err.error.errors) msg = Object.values(err.error.errors).flat().join(' | ');
              else msg = 'Datos inválidos. Revisa los campos.';
            }
          } else if (err?.status === 0) msg = 'No se pudo conectar con el servidor.';

          this.showToastMessage('error', msg);
        }
      });
  }
}
