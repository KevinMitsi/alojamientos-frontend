import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterUserDTO } from '../../models/user.model';
import { finalize } from 'rxjs/operators';
import { NotificationComponent } from '../notification-component/notification-component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NotificationComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements AfterViewInit {
  registerForm: FormGroup;
  errorMsg: string = '';
  loading = false;
  
  @ViewChild('notification', { static: false }) notification!: NotificationComponent;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
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

  ngAfterViewInit() {
    // Verifica que el componente esté disponible
    console.log('NotificationComponent cargado:', this.notification);
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get name() { return this.registerForm.get('name'); }
  get phone() { return this.registerForm.get('phone'); }
  get email() { return this.registerForm.get('email'); }
  get dateBirth() { return this.registerForm.get('dateBirth'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

 onSubmit(): void {
  console.log('🔥 onSubmit() EJECUTADO');
  console.log('Form válido:', this.registerForm.valid);
  console.log('Form value:', this.registerForm.value);

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    this.errorMsg = 'Por favor, completa los campos correctamente.';
    return;
  }

  const form = this.registerForm.value;
  const rawDate = form.dateBirth;
  let isoDate: string;

  if (!rawDate) {
    this.errorMsg = 'Fecha de nacimiento inválida.';
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

  console.log('📦 Payload:', payload);
  
  this.loading = true;
  this.errorMsg = '';

  console.log('🚀 Llamando authService.register...');

  this.authService.register(payload)
    .pipe(finalize(() => {
      console.log('🏁 Finalize ejecutado');
      this.loading = false;
    }))
    .subscribe({
      next: (res) => {
        console.log('✅ Registro exitoso:', res);
        console.log('📢 Llamando notification.show...');
        console.log('Notification component:', this.notification);
        
        this.notification.show('¡Usuario registrado exitosamente!', 'success');
        
        console.log('Después de show() - visible:', this.notification.visible);
        console.log('Después de show() - message:', this.notification.message);
        
        setTimeout(() => {
          console.log('🔄 Navegando a /login');
          this.router.navigate(['/login']);
        }, 3000);
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
          } else msg = 'Datos inválidos.';
        } else if (err?.status === 0) {
          msg = 'No se pudo conectar con el servidor.';
        }
        
        this.errorMsg = msg;
        console.log('📢 Mostrando notificación de error');
        this.notification.show(msg, 'error');
        console.log('Después de show error - visible:', this.notification.visible);
      }
    });
}
  
}