import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.css'
})

export class PasswordRecovery {
  private readonly fb = inject(FormBuilder);
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['']
  });

  loading = false;
  codeSent = false;

  constructor() {
    // Suscribirse a los cambios del formulario para actualizar codeSent automáticamente
    this.form.valueChanges.subscribe(values => {
      // Si el email se borra, ocultar el campo de código
      if (!values.email || values.email.trim() === '') {
        if (this.codeSent) {
          this.codeSent = false;
          this.form.get('code')?.reset();
          this.cdr.detectChanges();
        }
      }
    });
  }

  requestReset() {
    const emailControl = this.form.get('email');
    
    if (emailControl?.invalid) {
      emailControl.markAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Email requerido',
        text: 'Por favor ingresa un email válido',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.loading = true;
    const { email } = this.form.value;

    this.passwordResetService.requestReset({ email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.codeSent = true;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'success',
          title: 'Código enviado',
          text: 'Si el email existe, se ha enviado un código de recuperación a tu correo',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745'
        });
      },
      error: (err) => {
        this.loading = false;
        
        const errorMessage = err?.error?.message || 'Error al solicitar la recuperación. Intenta nuevamente.';
        
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

  verifyCode() {
    const codeControl = this.form.get('code');
    
    if (!codeControl?.value || codeControl.value.trim() === '') {
      codeControl?.markAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Código requerido',
        text: 'Por favor ingresa el código que recibiste en tu correo',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const code = codeControl.value.trim();
    
    // Validar que el código tenga 6 dígitos
    if (!/^\d{6}$/.test(code)) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: 'El código debe tener 6 dígitos numéricos',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // Redirigir al componente de cambio de contraseña con el token
    this.router.navigate(['/change-password'], { 
      queryParams: { token: code }
    });
  }

  get email() { return this.form.get('email'); }
  get code() { return this.form.get('code'); }
}
