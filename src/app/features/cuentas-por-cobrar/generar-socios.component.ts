import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ServicioService } from '../../core/services/servicio.service';
import { CuentaPorCobrarDTO, ServicioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

const ETAPAS_DISPONIBLES = [1, 2, 3];

@Component({
  selector: 'app-generar-cuentas-socios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generar-socios.component.html',
})
export class GenerarSociosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly servicioService = inject(ServicioService);

  readonly etapasDisponibles = ETAPAS_DISPONIBLES;
  readonly servicios = signal<ServicioDTO[]>([]);
  readonly etapasSeleccionadas = signal<Set<number>>(new Set());

  readonly cargandoCatalogos = signal(true);
  readonly generando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly cuentasGeneradas = signal<CuentaPorCobrarDTO[] | null>(null);

  readonly form = this.fb.nonNullable.group({
    servicioId: [null as number | null, [Validators.required]],
    periodo: ['', [Validators.required, Validators.maxLength(20)]],
    monto: [null as number | null, [Validators.min(0)]],
    soloUnicos: [false],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    this.servicioService
      .listar()
      .pipe(finalize(() => this.cargandoCatalogos.set(false)))
      .subscribe({
        next: (servicios) => this.servicios.set(servicios),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  estaSeleccionada(etapa: number): boolean {
    return this.etapasSeleccionadas().has(etapa);
  }

  toggleEtapa(etapa: number, marcada: boolean): void {
    this.etapasSeleccionadas.update((actual) => {
      const nuevo = new Set(actual);
      marcada ? nuevo.add(etapa) : nuevo.delete(etapa);
      return nuevo;
    });
  }

  onSubmit(): void {
    this.errorMensaje.set(null);
    this.cuentasGeneradas.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const etapas = Array.from(this.etapasSeleccionadas()).sort();

    this.generando.set(true);

    this.cuentaService
      .generarPorSocios({
        servicioId: valores.servicioId as number,
        periodo: valores.periodo,
        monto: valores.monto ?? undefined,
        etapas: etapas.length > 0 ? etapas : undefined,
        soloUnicos: valores.soloUnicos,
      })
      .pipe(finalize(() => this.generando.set(false)))
      .subscribe({
        next: (cuentas) => this.cuentasGeneradas.set(cuentas),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudieron generar las cuentas.');
    }
  }
}
