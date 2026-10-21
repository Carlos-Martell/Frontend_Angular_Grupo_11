import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SocioService } from '../../core/services/socio.service';
import { ErrorResponse } from '../../core/models/error-response.model';
import { fechaPasadaValidator } from '../../shared/validators/fecha-pasada.validator';

@Component({
  selector: 'app-socio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './socio-form.component.html',
})
export class SocioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly socioService = inject(SocioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly socioId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    accion: ['', [Validators.maxLength(50)]],
    etapa: [1, [Validators.required, Validators.min(1)]],
    fechaNacimiento: ['', [fechaPasadaValidator()]],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    if (this.esEdicion && this.socioId !== null) {
      this.socioService
        .obtener(this.socioId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: (socio) =>
            this.form.patchValue({
              codigo: socio.codigo,
              nombres: socio.nombres,
              apellidos: socio.apellidos,
              accion: socio.accion ?? '',
              etapa: socio.etapa,
              fechaNacimiento: socio.fechaNacimiento ?? '',
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
    const socio = {
      codigo: valores.codigo,
      nombres: valores.nombres,
      apellidos: valores.apellidos,
      accion: valores.accion || undefined,
      etapa: valores.etapa,
      fechaNacimiento: valores.fechaNacimiento || undefined,
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.socioId !== null
        ? this.socioService.actualizar(this.socioId, socio)
        : this.socioService.crear(socio);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/socios']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el socio.');
    }
  }
}
