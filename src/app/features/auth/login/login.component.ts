import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorResponse } from '../../../core/models/error-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly sesionExpirada = this.route.snapshot.queryParamMap.get('sesionExpirada') === 'true';

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
          this.router.navigateByUrl(redirectTo || '/');
        },
        error: (error: HttpErrorResponse) => {
          const cuerpo = error.error as ErrorResponse | undefined;
          if (error.status === 401) {
            this.errorMensaje.set('Usuario o contraseña incorrectos.');
          } else {
            this.errorMensaje.set(cuerpo?.message || 'No se pudo iniciar sesión. Intente nuevamente.');
          }
        },
      });
  }
}
