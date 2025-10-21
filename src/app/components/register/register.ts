import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors,ReactiveFormsModule  } from '@angular/forms';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-register',
   standalone: true,
  imports: [ReactiveFormsModule, CommonModule,RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
registerForm: FormGroup;
  errorMsg: string = '';

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(100)]],
        phone: ['', [Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
        dateBirth: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator } // ✅ Validación personalizada
    );
  }

  // Validar que las contraseñas coincidan
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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMsg = 'Por favor, completa los campos correctamente.';
      return;
    }
    this.errorMsg = '';
    console.log('Formulario de registro:', this.registerForm.value);
  }
}