import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { BancoService } from '../../core/services/banco.service';
import { AuthService } from '../../core/services/auth.service';
import { BancoDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-banco-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './banco-list.component.html',
})
export class BancoListComponent {
  private readonly bancoService = inject(BancoService);
  private readonly authService = inject(AuthService);

  readonly esAdministrador = this.authService.esAdministrador;

  readonly bancos = signal<BancoDTO[]>([]);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly filtro = signal('');
  readonly eliminandoId = signal<number | null>(null);

  readonly bancosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.bancos();
    }
    return this.bancos().filter(
      (b) =>
        b.nombre.toLowerCase().includes(texto) ||
        b.numeroCuenta.toLowerCase().includes(texto)
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.errorMensaje.set(null);
    this.cargando.set(true);
    this.bancoService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (bancos) => this.bancos.set(bancos),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  eliminar(banco: BancoDTO): void {
    if (!banco.id) {
      return;
    }
    const confirmado = confirm(`¿Eliminar el banco "${banco.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) {
      return;
    }

    this.errorMensaje.set(null);
    this.eliminandoId.set(banco.id);
    this.bancoService
      .eliminar(banco.id)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.bancos.update((lista) => lista.filter((b) => b.id !== banco.id)),
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    this.errorMensaje.set(cuerpo?.message || 'Ocurrió un error al comunicarse con el servidor.');
  }
}
