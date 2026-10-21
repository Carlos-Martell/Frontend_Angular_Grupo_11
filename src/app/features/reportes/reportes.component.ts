import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { ErrorResponse } from '../../core/models/error-response.model';
import { descargarBlob, extraerNombreArchivo } from '../../core/utils/descargar-archivo.util';

type TipoFiltro = 'DIARIO' | 'MENSUAL';

interface ReporteDefinicion {
  id: string;
  titulo: string;
  descripcion: string;
  tipoFiltro: TipoFiltro;
  descargar: (valor: string) => Observable<HttpResponse<Blob>>;
  nombrePorDefecto: (valor: string) => string;
}

function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}
function fechaHoy(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
})
export class ReportesComponent {
  private readonly reporteService = inject(ReporteService);

  readonly fecha = signal(fechaHoy());
  readonly mes = signal(mesActual());

  readonly descargandoId = signal<string | null>(null);
  readonly errorMensaje = signal<string | null>(null);

  readonly reportesDiarios: ReporteDefinicion[] = [
    {
      id: 'movimientos-diarios',
      titulo: 'Movimientos diarios',
      descripcion: 'Ingresos y egresos registrados en la fecha elegida.',
      tipoFiltro: 'DIARIO',
      descargar: (fecha) => this.reporteService.movimientosDiarios(fecha),
      nombrePorDefecto: (fecha) => `movimientos-diarios-${fecha}.xlsx`,
    },
    {
      id: 'bancos',
      titulo: 'Movimientos bancarios',
      descripcion: 'Recibos bancarios (canjes y depósitos) de la fecha elegida.',
      tipoFiltro: 'DIARIO',
      descargar: (fecha) => this.reporteService.bancos(fecha),
      nombrePorDefecto: (fecha) => `bancos-${fecha}.xlsx`,
    },
  ];

  readonly reportesMensuales: ReporteDefinicion[] = [
    {
      id: 'totales',
      titulo: 'Totales del mes',
      descripcion: 'Totales generales de ingresos y egresos del mes elegido.',
      tipoFiltro: 'MENSUAL',
      descargar: (mes) => this.reporteService.totales(mes),
      nombrePorDefecto: (mes) => `totales-${mes}.xlsx`,
    },
    {
      id: 'mensual',
      titulo: 'Reporte mensual',
      descripcion: 'Detalle general de movimientos del mes elegido.',
      tipoFiltro: 'MENSUAL',
      descargar: (mes) => this.reporteService.mensual(mes),
      nombrePorDefecto: (mes) => `mensual-${mes}.xlsx`,
    },
    {
      id: 'socios',
      titulo: 'Socios',
      descripcion: 'Cuentas y pagos de socios del mes elegido.',
      tipoFiltro: 'MENSUAL',
      descargar: (mes) => this.reporteService.socios(mes),
      nombrePorDefecto: (mes) => `socios-${mes}.xlsx`,
    },
    {
      id: 'no-socios',
      titulo: 'No socios',
      descripcion: 'Cuentas y pagos de puestos sin socio asociado del mes elegido.',
      tipoFiltro: 'MENSUAL',
      descargar: (mes) => this.reporteService.noSocios(mes),
      nombrePorDefecto: (mes) => `no-socios-${mes}.xlsx`,
    },
    {
      id: 'egresos',
      titulo: 'Egresos',
      descripcion: 'Egresos registrados en el mes elegido.',
      tipoFiltro: 'MENSUAL',
      descargar: (mes) => this.reporteService.egresos(mes),
      nombrePorDefecto: (mes) => `egresos-${mes}.xlsx`,
    },
  ];

  descargar(reporte: ReporteDefinicion): void {
    const valor = reporte.tipoFiltro === 'DIARIO' ? this.fecha() : this.mes();
    if (!valor) {
      return;
    }

    this.errorMensaje.set(null);
    this.descargandoId.set(reporte.id);

    reporte
      .descargar(valor)
      .pipe(finalize(() => this.descargandoId.set(null)))
      .subscribe({
        next: (respuesta) => {
          const blob = respuesta.body;
          if (!blob) {
            this.errorMensaje.set('El servidor no devolvió contenido para este reporte.');
            return;
          }
          const nombreArchivo = extraerNombreArchivo(
            respuesta.headers,
            reporte.nombrePorDefecto(valor)
          );
          descargarBlob(blob, nombreArchivo);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {

    if (error.error instanceof Blob) {
      error.error
        .text()
        .then((texto) => {
          try {
            const cuerpo = JSON.parse(texto) as ErrorResponse;
            this.errorMensaje.set(cuerpo.message || 'No se pudo generar el reporte.');
          } catch {
            this.errorMensaje.set('No se pudo generar el reporte.');
          }
        })
        .catch(() => this.errorMensaje.set('No se pudo generar el reporte.'));
      return;
    }

    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'No se pudo generar el reporte.');
  }
}
