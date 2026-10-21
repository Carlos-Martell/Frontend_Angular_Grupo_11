import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './usuario-list.component.html',
})
export class UsuarioListComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);

  readonly usuarioIdPropio = this.authService.usuarioId;

  readonly usuarios = signal<UsuarioDTO[]>([]);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  readonly usuariosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.usuarios();
    }
    return this.usuarios().filter(
      (u) =>
        u.username.toLowerCase().includes(texto) ||
        u.nombres.toLowerCase().includes(texto) ||
        u.apellidos.toLowerCase().includes(texto) ||
        (u.email ?? '').toLowerCase().includes(texto)
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.usuarioService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(usuario: UsuarioDTO): void {
    if (!usuario.id) {
      return;
    }
    const confirmado = confirm(
      `¿Eliminar al usuario ${usuario.username}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(usuario.id);
    this.usuarioService
      .eliminar(usuario.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
