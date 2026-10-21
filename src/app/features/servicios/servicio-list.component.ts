import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ServicioService } from '../../core/services/servicio.service';
import { AuthService } from '../../core/services/auth.service';
import { ServicioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-servicio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './servicio-list.component.html',
})
export class ServicioListComponent {
  private readonly servicioService = inject(ServicioService);
  private readonly authService = inject(AuthService);

  readonly esAdministrador = this.authService.esAdministrador;

  readonly servicios = signal<ServicioDTO[]>([]);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  readonly serviciosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.servicios();
    }
    return this.servicios().filter((s) => s.nombre.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.servicioService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (servicios) => this.servicios.set(servicios),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(servicio: ServicioDTO): void {
    if (!servicio.id) {
      return;
    }
    const confirmado = confirm(`¿Eliminar el servicio "${servicio.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(servicio.id);
    this.servicioService
      .eliminar(servicio.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.servicios.update((lista) => lista.filter((s) => s.id !== servicio.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
