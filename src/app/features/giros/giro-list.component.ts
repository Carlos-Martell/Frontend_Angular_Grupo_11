import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { GiroService } from '../../core/services/giro.service';
import { AuthService } from '../../core/services/auth.service';
import { GiroDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-giro-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './giro-list.component.html',
})
export class GiroListComponent {
  private readonly giroService = inject(GiroService);
  private readonly authService = inject(AuthService);

  readonly esAdministrador = this.authService.esAdministrador;

  readonly giros = signal<GiroDTO[]>([]);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  readonly girosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.giros();
    }
    return this.giros().filter((g) => g.nombre.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.giroService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (giros) => this.giros.set(giros),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(giro: GiroDTO): void {
    if (!giro.id) {
      return;
    }
    const confirmado = confirm(`¿Eliminar el giro "${giro.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(giro.id);
    this.giroService
      .eliminar(giro.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.giros.update((lista) => lista.filter((g) => g.id !== giro.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
