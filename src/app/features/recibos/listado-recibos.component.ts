import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ReciboService } from '../../core/services/recibo.service';
import { ReciboDTO, TipoRecibo } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

function aInicioDeDia(fecha: string): string {
  return `${fecha}T00:00:00`;
}
function aFinDeDia(fecha: string): string {
  return `${fecha}T23:59:59`;
}

@Component({
  selector: 'app-listado-recibos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-recibos.component.html',
})
export class ListadoRecibosComponent {
  private readonly reciboService = inject(ReciboService);

  readonly tipos: TipoRecibo[] = ['INGRESO', 'BANCO'];

  readonly tipo = signal<TipoRecibo>('INGRESO');
  readonly desde = signal('');
  readonly hasta = signal('');

  readonly buscando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly seBusco = signal(false);
  readonly recibos = signal<ReciboDTO[]>([]);

  readonly reciboSeleccionado = signal<ReciboDTO | null>(null);
  readonly cargandoDetalle = signal(false);

  buscar(): void {
    this.errorMensaje.set(null);
    this.reciboSeleccionado.set(null);
    this.seBusco.set(true);
    this.buscando.set(true);

    this.reciboService
      .listar({
        tipo: this.tipo(),
        desde: this.desde() ? aInicioDeDia(this.desde()) : undefined,
        hasta: this.hasta() ? aFinDeDia(this.hasta()) : undefined,
      })
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (recibos) => this.recibos.set(recibos),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  verDetalle(recibo: ReciboDTO): void {
    if (!recibo.id) {
      this.reciboSeleccionado.set(recibo);
      return;
    }
    this.errorMensaje.set(null);
    this.cargandoDetalle.set(true);
    this.reciboService
      .obtener(recibo.id)
      .pipe(finalize(() => this.cargandoDetalle.set(false)))
      .subscribe({
        next: (detalle) => this.reciboSeleccionado.set(detalle),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  cerrarDetalle(): void {
    this.reciboSeleccionado.set(null);
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
