import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { UsuarioService } from '../../core/services/usuario.service';
import { RolUsuario, UsuarioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'OPERADOR_CAJA'];

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly usuarioId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],

    password: ['', this.esEdicion ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]],
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    rol: ['OPERADOR_CAJA' as RolUsuario, [Validators.required]],
    activo: [true],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    if (this.esEdicion && this.usuarioId !== null) {
      this.usuarioService
        .obtener(this.usuarioId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: (usuario) =>
            this.form.patchValue({
              username: usuario.username,

              password: '',
              nombres: usuario.nombres,
              apellidos: usuario.apellidos,
              email: usuario.email ?? '',
              rol: usuario.rol,
              activo: usuario.activo ?? true,
            }),
          error: (error: HttpErrorResponse) => this.manejarError(error),
        });
    }
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const passwordIngresado = valores.password.trim();

    const usuario: UsuarioDTO = {
      username: valores.username,
      nombres: valores.nombres,
      apellidos: valores.apellidos,
      email: valores.email || undefined,
      rol: valores.rol,
      activo: valores.activo,

      ...(passwordIngresado ? { password: passwordIngresado } : {}),
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.usuarioId !== null
        ? this.usuarioService.actualizar(this.usuarioId, usuario)
        : this.usuarioService.crear(usuario);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/usuarios']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el usuario.');
    }
  }
}
