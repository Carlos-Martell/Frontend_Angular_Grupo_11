import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ServicioService } from '../../core/services/servicio.service';
import { PuestoService } from '../../core/services/puesto.service';
import { CuentaPorCobrarDTO, PuestoDTO, ServicioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-generar-cuentas-puestos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generar-puestos.component.html',
})
export class GenerarPuestosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly servicioService = inject(ServicioService);
  private readonly puestoService = inject(PuestoService);

  readonly servicios = signal<ServicioDTO[]>([]);
  readonly puestos = signal<PuestoDTO[]>([]);
  readonly puestoIdsSeleccionados = signal<Set<number>>(new Set());

  readonly cargandoCatalogos = signal(true);
  readonly generando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly cuentasGeneradas = signal<CuentaPorCobrarDTO[] | null>(null);

  readonly form = this.fb.nonNullable.group({
    servicioId: [null as number | null, [Validators.required]],
    periodo: ['', [Validators.required, Validators.maxLength(20)]],
  });

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
          this.servicios.set(servicios);
          this.puestos.set(puestos);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  descripcionPuesto(puesto: PuestoDTO): string {
    return puesto.inquilinoNombre ? `${puesto.numero} — ${puesto.inquilinoNombre}` : puesto.numero;
  }

  estaSeleccionado(puestoId: number | undefined): boolean {
    return puestoId !== undefined && this.puestoIdsSeleccionados().has(puestoId);
  }

  toggleSeleccion(puestoId: number | undefined, marcado: boolean): void {
    if (puestoId === undefined) {
      return;
    }
    this.puestoIdsSeleccionados.update((actual) => {
      const nuevo = new Set(actual);
      marcado ? nuevo.add(puestoId) : nuevo.delete(puestoId);
      return nuevo;
    });
  }

  seleccionarTodos(): void {
    const ids = this.puestos()
      .map((p) => p.id)
      .filter((id): id is number => id !== undefined);
    this.puestoIdsSeleccionados.set(new Set(ids));
  }

  limpiarSeleccion(): void {
    this.puestoIdsSeleccionados.set(new Set());
  }

  onSubmit(): void {
    this.errorMensaje.set(null);
    this.cuentasGeneradas.set(null);

    if (this.form.invalid || this.puestoIdsSeleccionados().size === 0) {
      this.form.markAllAsTouched();
      if (this.puestoIdsSeleccionados().size === 0) {
        this.errorMensaje.set('Seleccione al menos un puesto.');
      }
      return;
    }

    const valores = this.form.getRawValue();
    this.generando.set(true);

    this.cuentaService
      .generarPorPuestos({
        servicioId: valores.servicioId as number,
        periodo: valores.periodo,
        puestoIds: Array.from(this.puestoIdsSeleccionados()),
      })
      .pipe(finalize(() => this.generando.set(false)))
      .subscribe({
        next: (cuentas) => {
          this.cuentasGeneradas.set(cuentas);
          this.limpiarSeleccion();
        },
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
