import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { CuentaPorCobrarService } from '../../core/services/cuenta-por-cobrar.service';
import { ReciboService } from '../../core/services/recibo.service';
import { SocioService } from '../../core/services/socio.service';
import { BancoService } from '../../core/services/banco.service';
import { ServicioService } from '../../core/services/servicio.service';
import { BancoDTO, CuentaPorCobrarDTO, ReciboDTO, ServicioDTO, SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-canje-banco',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './canje-banco.component.html',
})
export class CanjeBancoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cuentaService = inject(CuentaPorCobrarService);
  private readonly reciboService = inject(ReciboService);
  private readonly socioService = inject(SocioService);
  private readonly bancoService = inject(BancoService);
  private readonly servicioService = inject(ServicioService);
  
  readonly authService = inject(AuthService);

  readonly socios = signal<SocioDTO[]>([]);
  readonly bancos = signal<BancoDTO[]>([]);
  private readonly servicios = signal<ServicioDTO[]>([]);

  readonly socioId = signal<number | null>(null);
  readonly buscando = signal(false);
  readonly seBusco = signal(false);
  readonly cuentasPendientes = signal<CuentaPorCobrarDTO[]>([]);

  readonly cargandoCatalogos = signal(true);
  readonly canjeando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly reciboGenerado = signal<ReciboDTO | null>(null);

  private readonly servicioPorId = computed(() => {
    const mapa = new Map<number, ServicioDTO>();
    this.servicios().forEach((s) => s.id !== undefined && mapa.set(s.id, s));
    return mapa;
  });

  readonly form = this.fb.nonNullable.group({
    cuentaId: [null as number | null, [Validators.required]],
    bancoId: [null as number | null, [Validators.required]],
    fechaDeposito: ['', [Validators.required]],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    forkJoin({
      socios: this.socioService.listar(),
      bancos: this.bancoService.listar(),
      servicios: this.servicioService.listar(),
    })
      .pipe(finalize(() => this.cargandoCatalogos.set(false)))
      .subscribe({
        next: ({ socios, bancos, servicios }) => {
          this.socios.set(socios);
          this.bancos.set(bancos);
          this.servicios.set(servicios);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  nombreServicio(servicioId: number): string {
    return this.servicioPorId().get(servicioId)?.nombre ?? `#${servicioId}`;
  }

  buscarCuentas(): void {
    const id = this.socioId();
    if (id === null) {
      return;
    }
    this.errorMensaje.set(null);
    this.reciboGenerado.set(null);
    this.seBusco.set(true);
    this.buscando.set(true);
    this.form.patchValue({ cuentaId: null });

    this.cuentaService
      .listarPorSocio(id)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (cuentas) => this.cuentasPendientes.set(cuentas.filter((c) => c.estado === 'PENDIENTE')),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioId = this.authService.usuarioId();
    if (usuarioId === null) {
      this.errorMensaje.set('No se pudo determinar tu usuario. Volvé a iniciar sesión.');
      return;
    }

    const valores = this.form.getRawValue();
    this.canjeando.set(true);

    this.reciboService
      .canjearBanco({
        cuentaId: valores.cuentaId as number,
        bancoId: valores.bancoId as number,
        fechaDeposito: valores.fechaDeposito,
        usuarioId,
      })
      .pipe(finalize(() => this.canjeando.set(false)))
      .subscribe({
        next: (recibo) => {
          this.reciboGenerado.set(recibo);
          this.buscarCuentas();
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo procesar el canje.');
    }
  }
}
