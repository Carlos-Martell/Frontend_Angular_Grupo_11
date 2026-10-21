import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin, switchMap  } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ReciboService } from '../../core/services/recibo.service';
import { ServicioService } from '../../core/services/servicio.service';
import { SocioService } from '../../core/services/socio.service';
import { PuestoService } from '../../core/services/puesto.service';
import { AuthService } from '../../core/services/auth.service';
import { CuentaPorCobrarDTO, PuestoDTO, ReciboDTO, ServicioDTO, SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

type TipoBusqueda = 'SOCIO' | 'PUESTO';

@Component({
  selector: 'app-procesar-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procesar-pago.component.html',
})
export class ProcesarPagoComponent {
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly reciboService = inject(ReciboService);
  private readonly servicioService = inject(ServicioService);
  private readonly socioService = inject(SocioService);
  private readonly puestoService = inject(PuestoService);
  
  readonly authService = inject(AuthService);

  readonly tipo = signal<TipoBusqueda>('SOCIO');
  readonly entidadId = signal<number | null>(null);

  readonly socios = signal<SocioDTO[]>([]);
  readonly puestos = signal<PuestoDTO[]>([]);
  private readonly servicios = signal<ServicioDTO[]>([]);

  readonly cargandoCatalogos = signal(true);
  readonly buscando = signal(false);
  readonly procesando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly seBusco = signal(false);

  readonly cuentas = signal<CuentaPorCobrarDTO[]>([]);
  readonly cuentaIdsSeleccionadas = signal<Set<number>>(new Set());
  readonly recibosGenerados = signal<ReciboDTO[] | null>(null);

  private readonly servicioPorId = computed(() => {
    const mapa = new Map<number, ServicioDTO>();
    this.servicios().forEach((s) => s.id !== undefined && mapa.set(s.id, s));
    return mapa;
  });

  readonly cuentasPendientes = computed(() => this.cuentas().filter((c) => c.estado === 'PENDIENTE'));

  readonly totalSeleccionado = computed(() =>
    this.cuentasPendientes()
      .filter((c) => c.id !== undefined && this.cuentaIdsSeleccionadas().has(c.id))
      .reduce((suma, c) => suma + c.monto, 0)
  );

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
    this.reiniciarResultados();
  }

  private reiniciarResultados(): void {
    this.cuentas.set([]);
    this.cuentaIdsSeleccionadas.set(new Set());
    this.recibosGenerados.set(null);
    this.seBusco.set(false);
  }

  buscar(): void {
    const id = this.entidadId();
    if (id === null) {
      return;
    }
    this.errorMensaje.set(null);
    this.recibosGenerados.set(null);
    this.cuentaIdsSeleccionadas.set(new Set());
    this.seBusco.set(true);
    this.buscando.set(true);

    const peticion =
      this.tipo() === 'SOCIO'
        ? this.cuentaService.listarPorSocio(id)
        : this.cuentaService.listarPorPuesto(id);

    peticion.pipe(finalize(() => this.buscando.set(false))).subscribe({
      next: (cuentas) => this.cuentas.set(cuentas),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  estaSeleccionada(cuentaId: number | undefined): boolean {
    return cuentaId !== undefined && this.cuentaIdsSeleccionadas().has(cuentaId);
  }

  toggleSeleccion(cuentaId: number | undefined, marcada: boolean): void {
    if (cuentaId === undefined) {
      return;
    }
    this.cuentaIdsSeleccionadas.update((actual) => {
      const nuevo = new Set(actual);
      marcada ? nuevo.add(cuentaId) : nuevo.delete(cuentaId);
      return nuevo;
    });
  }

  procesarPago(): void {
    const cuentaIds = Array.from(this.cuentaIdsSeleccionadas());
    const usuarioId = this.authService.usuarioId();

    this.errorMensaje.set(null);

    if (cuentaIds.length === 0) {
      this.errorMensaje.set('Seleccione al menos una cuenta pendiente.');
      return;
    }
    if (usuarioId === null) {
      this.errorMensaje.set('No se pudo determinar tu usuario. Volvé a iniciar sesión.');
      return;
    }

    this.procesando.set(true);
  forkJoin(cuentaIds.map((id) => this.cuentaService.abonar(id)))
    .pipe(
      switchMap(() => this.reciboService.procesarPago({ cuentaIds, usuarioId })),
      finalize(() => this.procesando.set(false))
    )
    .subscribe({
      next: (recibos) => {
        this.recibosGenerados.set(recibos);
        this.buscar();
      },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
    }
  }
}
