import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ServicioService } from '../../core/services/servicio.service';
import { PuestoService } from '../../core/services/puesto.service';
import { CuentaPorCobrarDTO, PuestoDTO, ServicioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

function lecturasValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const inicial = group.get('lecturaInicial')?.value;
    const final = group.get('lecturaFinal')?.value;
    if (inicial === null || final === null || inicial === '' || final === '') {
      return null;
    }
    return Number(final) >= Number(inicial) ? null : { lecturasInvalidas: true };
  };
}

@Component({
  selector: 'app-generar-cuentas-consumo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generar-consumo.component.html',
})
export class GenerarConsumoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly servicioService = inject(ServicioService);
  private readonly puestoService = inject(PuestoService);

  private readonly todosLosServicios = signal<ServicioDTO[]>([]);
  readonly puestos = signal<PuestoDTO[]>([]);

  readonly serviciosPorConsumo = computed(() =>
    this.todosLosServicios().filter((s) => s.esConsumo)
  );

  readonly cargandoCatalogos = signal(true);
  readonly generando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly cuentaGenerada = signal<CuentaPorCobrarDTO | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      servicioId: [null as number | null, [Validators.required]],
      periodo: ['', [Validators.required, Validators.maxLength(20)]],
      puestoId: [null as number | null, [Validators.required]],
      lecturaInicial: [null as number | null, [Validators.required, Validators.min(0)]],
      lecturaFinal: [null as number | null, [Validators.required, Validators.min(0)]],
    },
    { validators: lecturasValidator() }
  );

  get f() {
    return this.form.controls;
  }

  constructor() {
    forkJoin({
      servicios: this.servicioService.listar(),
      puestos: this.puestoService.listar(),
    })
      .pipe(finalize(() => this.cargandoCatalogos.set(false)))
      .subscribe({
        next: ({ servicios, puestos }) => {
          this.todosLosServicios.set(servicios);
          this.puestos.set(puestos);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  onSubmit(): void {
    this.errorMensaje.set(null);
    this.cuentaGenerada.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.generando.set(true);

    this.cuentaService
      .generarPorConsumo({
        servicioId: valores.servicioId as number,
        periodo: valores.periodo,
        puestoId: valores.puestoId as number,
        lecturaInicial: valores.lecturaInicial as number,
        lecturaFinal: valores.lecturaFinal as number,
      })
      .pipe(finalize(() => this.generando.set(false)))
      .subscribe({
        next: (cuenta) => {
          this.cuentaGenerada.set(cuenta);
          this.form.patchValue({ lecturaInicial: null, lecturaFinal: null });
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo generar la cuenta.');
    }
  }
}
