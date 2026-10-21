import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { PuestoService } from '../../core/services/puesto.service';
import { GiroService } from '../../core/services/giro.service';
import { SocioService } from '../../core/services/socio.service';
import { AuthService } from '../../core/services/auth.service';
import { GiroDTO, PuestoDTO, SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-puesto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './puesto-list.component.html',
})
export class PuestoListComponent {
  private readonly puestoService = inject(PuestoService);
  private readonly giroService = inject(GiroService);
  private readonly socioService = inject(SocioService);
  private readonly authService = inject(AuthService);

  readonly esAdministrador = this.authService.esAdministrador;

  readonly puestos = signal<PuestoDTO[]>([]);
  private readonly giros = signal<GiroDTO[]>([]);
  private readonly socios = signal<SocioDTO[]>([]);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  private readonly giroPorId = computed(() => {
    const mapa = new Map<number, GiroDTO>();
    this.giros().forEach((g) => g.id !== undefined && mapa.set(g.id, g));
    return mapa;
  });

  private readonly socioPorId = computed(() => {
    const mapa = new Map<number, SocioDTO>();
    this.socios().forEach((s) => s.id !== undefined && mapa.set(s.id, s));
    return mapa;
  });

  readonly puestosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.puestos();
    }
    return this.puestos().filter(
      (p) =>
        p.numero.toLowerCase().includes(texto) ||
        (p.inquilinoNombre ?? '').toLowerCase().includes(texto) ||
        this.nombreGiro(p.giroId).toLowerCase().includes(texto) ||
        this.nombreSocio(p.socioId).toLowerCase().includes(texto)
    );
  });

  constructor() {
    this.cargar();
  }

  nombreGiro(giroId?: number): string {
    if (giroId === undefined) {
      return '—';
    }
    return this.giroPorId().get(giroId)?.nombre ?? `#${giroId}`;
  }

  nombreSocio(socioId?: number): string {
    if (socioId === undefined) {
      return 'Sin socio';
    }
    const socio = this.socioPorId().get(socioId);
    return socio ? `${socio.nombres} ${socio.apellidos}` : `#${socioId}`;
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    forkJoin({
      puestos: this.puestoService.listar(),
      giros: this.giroService.listar(),
      socios: this.socioService.listar(),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: ({ puestos, giros, socios }) => {
          this.puestos.set(puestos);
          this.giros.set(giros);
          this.socios.set(socios);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(puesto: PuestoDTO): void {
    if (!puesto.id) {
      return;
    }
    const confirmado = confirm(`¿Eliminar el puesto "${puesto.numero}"? Esta acción no se puede deshacer.`);
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(puesto.id);
    this.puestoService
      .eliminar(puesto.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.puestos.update((lista) => lista.filter((p) => p.id !== puesto.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
