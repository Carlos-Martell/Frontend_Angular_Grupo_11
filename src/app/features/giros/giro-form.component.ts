import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { GiroService } from '../../core/services/giro.service';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-giro-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './giro-form.component.html',
})
export class GiroFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly giroService = inject(GiroService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly giroId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(255)]],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    if (this.esEdicion && this.giroId !== null) {
      this.giroService
        .obtener(this.giroId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: (giro) =>
            this.form.patchValue({
              nombre: giro.nombre,
              descripcion: giro.descripcion ?? '',
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
    const giro = {
      nombre: valores.nombre,
      descripcion: valores.descripcion || undefined,
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.giroId !== null
        ? this.giroService.actualizar(this.giroId, giro)
        : this.giroService.crear(giro);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/giros']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el giro.');
    }
  }
}
