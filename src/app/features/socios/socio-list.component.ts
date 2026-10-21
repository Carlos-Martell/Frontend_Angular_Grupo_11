import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SocioService } from '../../core/services/socio.service';
import { AuthService } from '../../core/services/auth.service';
import { SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-socio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './socio-list.component.html',
})
export class SocioListComponent {
  private readonly socioService = inject(SocioService);
  private readonly authService = inject(AuthService);

  readonly esAdministrador = this.authService.esAdministrador;

  readonly socios = signal<SocioDTO[]>([]);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  readonly sociosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.socios();
    }
    return this.socios().filter(
      (s) =>
        s.codigo.toLowerCase().includes(texto) ||
        s.nombres.toLowerCase().includes(texto) ||
        s.apellidos.toLowerCase().includes(texto)
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.socioService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (socios) => this.socios.set(socios),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(socio: SocioDTO): void {
    if (!socio.id) {
      return;
    }
    const confirmado = confirm(
      `¿Eliminar al socio ${socio.codigo} - ${socio.nombres} ${socio.apellidos}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(socio.id);
    this.socioService
      .eliminar(socio.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.socios.update((lista) => lista.filter((s) => s.id !== socio.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
