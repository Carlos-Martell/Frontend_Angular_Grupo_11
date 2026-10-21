import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EgresoService } from '../../core/services/egreso.service';
import { EgresoDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro-egreso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-egreso.component.html',
})
export class RegistroEgresoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly egresoService = inject(EgresoService);
  
  readonly authService = inject(AuthService);

  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly egresoRegistrado = signal<EgresoDTO | null>(null);

  readonly form = this.fb.nonNullable.group({
    numeroDocumento: ['', [Validators.required, Validators.maxLength(30)]],
    proveedor: ['', [Validators.required, Validators.maxLength(150)]],
    fecha: ['', [Validators.required]],
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    documentoAsociado: ['', [Validators.maxLength(255)]],
    motivo: ['', [Validators.maxLength(255)]],
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

    const usuarioId = this.authService.usuarioId();
    if (usuarioId === null) {
      this.errorMensaje.set('No se pudo determinar tu usuario. Volvé a iniciar sesión.');
      return;
    }

    const valores = this.form.getRawValue();
    this.guardando.set(true);

    this.egresoService
      .registrar(
        {
          numeroDocumento: valores.numeroDocumento,
          proveedor: valores.proveedor,
          fecha: valores.fecha,
          importe: valores.importe as number,
          documentoAsociado: valores.documentoAsociado || undefined,
          motivo: valores.motivo || undefined,
        },
        usuarioId
      )
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (creado) => {
          this.egresoRegistrado.set(creado);
          this.form.reset({
            numeroDocumento: '',
            proveedor: '',
            fecha: '',
            importe: null,
            documentoAsociado: '',
            motivo: '',
          });
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo registrar el egreso.');
    }
  }
}
