import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EgresoService } from '../../core/services/egreso.service';
import { EgresoDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

function aFechaDelMes(mes: string): string {
  return `${mes}-01`;
}

@Component({
  selector: 'app-listado-egresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-egresos.component.html',
})
export class ListadoEgresosComponent {
  private readonly egresoService = inject(EgresoService);

  readonly mes = signal(this.mesActual());

  readonly buscando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly seBusco = signal(false);
  readonly egresos = signal<EgresoDTO[]>([]);
  readonly accionEnCursoId = signal<number | null>(null);
  readonly egresoSeleccionado = signal<EgresoDTO | null>(null);

  private mesActual(): string {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${hoy.getFullYear()}-${mm}`;
  }

  constructor() {
    this.buscar();
  }

  buscar(): void {
    const mes = this.mes();
    if (!mes) {
      return;
    }
    this.errorMensaje.set(null);
    this.egresoSeleccionado.set(null);
    this.seBusco.set(true);
    this.buscando.set(true);

    this.egresoService
      .listarPorMes(aFechaDelMes(mes))
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (egresos) => this.egresos.set(egresos),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  verDetalle(egreso: EgresoDTO): void {
    this.egresoSeleccionado.set(egreso);
  }

  cerrarDetalle(): void {
    this.egresoSeleccionado.set(null);
  }

  anular(egreso: EgresoDTO): void {
    if (!confirm(`¿Anular el egreso ${egreso.numeroDocumento}? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.aplicarAccion(egreso, (id) => this.egresoService.anular(id));
  }

  procesar(egreso: EgresoDTO): void {
    this.aplicarAccion(egreso, (id) => this.egresoService.procesar(id));
  }

  private aplicarAccion(
    egreso: EgresoDTO,
    accion: (id: number) => ReturnType<EgresoService['anular']>
  ): void {
    if (!egreso.id) {
      return;
    }
    this.errorMensaje.set(null);
    this.accionEnCursoId.set(egreso.id);

    accion(egreso.id)
      .pipe(finalize(() => this.accionEnCursoId.set(null)))
      .subscribe({
        next: (actualizado) => {
          this.egresos.update((lista) =>
            lista.map((e) => (e.id === actualizado.id ? actualizado : e))
          );
          if (this.egresoSeleccionado()?.id === actualizado.id) {
            this.egresoSeleccionado.set(actualizado);
          }
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
