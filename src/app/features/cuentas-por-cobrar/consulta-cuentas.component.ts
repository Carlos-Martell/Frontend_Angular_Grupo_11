import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ServicioService } from '../../core/services/servicio.service';
import { SocioService } from '../../core/services/socio.service';
import { PuestoService } from '../../core/services/puesto.service';
import { CuentaPorCobrarDTO, PuestoDTO, ServicioDTO, SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

type TipoBusqueda = 'SOCIO' | 'PUESTO';

@Component({
  selector: 'app-consulta-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulta-cuentas.component.html',
})
export class ConsultaCuentasComponent {
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly servicioService = inject(ServicioService);
  private readonly socioService = inject(SocioService);
  private readonly puestoService = inject(PuestoService);

  readonly tipo = signal<TipoBusqueda>('SOCIO');
  readonly entidadId = signal<number | null>(null);

  readonly socios = signal<SocioDTO[]>([]);
  readonly puestos = signal<PuestoDTO[]>([]);
  private readonly servicios = signal<ServicioDTO[]>([]);

  readonly cargandoCatalogos = signal(true);
  readonly buscando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly cuentas = signal<CuentaPorCobrarDTO[]>([]);
  readonly seSelecciono = signal(false);

  readonly cuentaIdsSeleccionadas = signal<Set<number>>(new Set());
  readonly calculandoTotal = signal(false);
  readonly total = signal<number | null>(null);

  readonly accionEnCursoId = signal<number | null>(null);

  private readonly servicioPorId = computed(() => {
    const mapa = new Map<number, ServicioDTO>();
    this.servicios().forEach((s) => s.id !== undefined && mapa.set(s.id, s));
    return mapa;
  });

  readonly opciones = computed(() => (this.tipo() === 'SOCIO' ? this.socios() : this.puestos()));

  readonly totalSeleccionCount = computed(() => this.cuentaIdsSeleccionadas().size);

  constructor() {
    forkJoin({
      socios: this.socioService.listar(),
      puestos: this.puestoService.listar(),
      servicios: this.servicioService.listar(),
    })
      .pipe(finalize(() => this.cargandoCatalogos.set(false)))
      .subscribe({
        next: ({ socios, puestos, servicios }) => {
          this.socios.set(socios);
          this.puestos.set(puestos);
          this.servicios.set(servicios);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  nombreServicio(servicioId: number): string {
    return this.servicioPorId().get(servicioId)?.nombre ?? `#${servicioId}`;
  }

  cambiarTipo(tipo: TipoBusqueda): void {
    this.tipo.set(tipo);
    this.entidadId.set(null);
    this.limpiarResultados();
  }

  buscar(): void {
    const id = this.entidadId();
    if (id === null) {
      return;
    }

    this.errorMensaje.set(null);
    this.seSelecciono.set(true);
    this.buscando.set(true);
    this.cuentaIdsSeleccionadas.set(new Set());
    this.total.set(null);

    const peticion =
      this.tipo() === 'SOCIO'
        ? this.cuentaService.listarPorSocio(id)
        : this.cuentaService.listarPorPuesto(id);

    peticion.pipe(finalize(() => this.buscando.set(false))).subscribe({
      next: (cuentas) => this.cuentas.set(cuentas),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private limpiarResultados(): void {
    this.cuentas.set([]);
    this.cuentaIdsSeleccionadas.set(new Set());
    this.total.set(null);
    this.seSelecciono.set(false);
  }

  estaSeleccionada(cuentaId: number | undefined): boolean {
    return cuentaId !== undefined && this.cuentaIdsSeleccionadas().has(cuentaId);
  }

  toggleSeleccion(cuentaId: number | undefined, marcada: boolean): void {
    if (cuentaId === undefined) {
      return;
    }
    this.total.set(null);
    this.cuentaIdsSeleccionadas.update((actual) => {
      const nuevo = new Set(actual);
      marcada ? nuevo.add(cuentaId) : nuevo.delete(cuentaId);
      return nuevo;
    });
  }

  exonerar(cuenta: CuentaPorCobrarDTO): void {
  if (!cuenta.id) {
    return;
  }
  this.errorMensaje.set(null);
  this.accionEnCursoId.set(cuenta.id);

  this.cuentaService.exonerar(cuenta.id)
    .pipe(finalize(() => this.accionEnCursoId.set(null)))
    .subscribe({
      next: (actualizada) => {
        this.cuentas.update((lista) =>
          lista.map((c) => (c.id === actualizada.id ? actualizada : c))
        );
        this.total.set(null);
      },
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
}
  calcularTotal(): void {
    const cuentaIds = Array.from(this.cuentaIdsSeleccionadas());
    if (cuentaIds.length === 0) {
      return;
    }
    this.errorMensaje.set(null);
    this.calculandoTotal.set(true);
    this.cuentaService
      .calcularTotal({ cuentaIds })
      .pipe(finalize(() => this.calculandoTotal.set(false)))
      .subscribe({
        next: (respuesta) => this.total.set(respuesta.total),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
