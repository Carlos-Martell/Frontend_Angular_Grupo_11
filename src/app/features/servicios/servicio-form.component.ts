import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ServicioService } from '../../core/services/servicio.service';
import { CargoA, Moneda, Recurrencia } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-servicio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './servicio-form.component.html',
})
export class ServicioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly servicioService = inject(ServicioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly recurrencias: Recurrencia[] = [
    'UNICA',
    'MENSUAL',
    'BIMESTRAL',
    'TRIMESTRAL',
    'SEMESTRAL',
    'ANUAL',
  ];
  readonly monedas: Moneda[] = ['PEN', 'USD'];
  readonly opcionesCargoA: CargoA[] = ['SOCIO', 'PUESTO'];

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly servicioId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    recurrencia: ['MENSUAL' as Recurrencia, [Validators.required]],
    costo: [0, [Validators.required, Validators.min(0)]],
    moneda: ['PEN' as Moneda, [Validators.required]],
    cargoA: ['PUESTO' as CargoA, [Validators.required]],
    esConsumo: [false],
    costoUnitario: [null as number | null],
  });

  get f() {
    return this.form.controls;
  }

  get requiereCostoUnitario(): boolean {
    return this.form.controls.esConsumo.value;
  }

  constructor() {

    this.form.controls.esConsumo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((esConsumo) => {
        const costoUnitarioControl = this.form.controls.costoUnitario;
        if (esConsumo) {
          costoUnitarioControl.setValidators([Validators.required, Validators.min(0)]);
        } else {
          costoUnitarioControl.clearValidators();
          costoUnitarioControl.setValue(null);
        }
        costoUnitarioControl.updateValueAndValidity();
      });

    if (this.esEdicion && this.servicioId !== null) {
      this.servicioService
        .obtener(this.servicioId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: (servicio) => {
            this.form.patchValue({
              nombre: servicio.nombre,
              recurrencia: servicio.recurrencia,
              costo: servicio.costo,
              moneda: servicio.moneda,
              cargoA: servicio.cargoA,
              esConsumo: servicio.esConsumo,
              costoUnitario: servicio.costoUnitario ?? null,
            });
            
            this.form.controls.esConsumo.updateValueAndValidity();
          },
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
    const servicio = {
      nombre: valores.nombre,
      recurrencia: valores.recurrencia,
      costo: valores.costo,
      moneda: valores.moneda,
      cargoA: valores.cargoA,
      esConsumo: valores.esConsumo,
      costoUnitario: valores.esConsumo ? valores.costoUnitario ?? undefined : undefined,
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.servicioId !== null
        ? this.servicioService.actualizar(this.servicioId, servicio)
        : this.servicioService.crear(servicio);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/servicios']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el servicio.');
    }
  }
}
