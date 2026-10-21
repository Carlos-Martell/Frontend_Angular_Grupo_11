import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EgresoService } from '../../core/services/egreso.service';
import { EgresoCargaMasivaResultado } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-carga-masiva-egresos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carga-masiva.component.html',
})
export class CargaMasivaComponent {
  private readonly egresoService = inject(EgresoService);
  
  readonly authService = inject(AuthService);

  readonly archivoSeleccionado = signal<File | null>(null);
  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly resultado = signal<EgresoCargaMasivaResultado | null>(null);

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado.set(input.files?.[0] ?? null);
    this.resultado.set(null);
    this.errorMensaje.set(null);
  }

  subir(): void {
    const archivo = this.archivoSeleccionado();
    const usuarioId = this.authService.usuarioId();

    this.errorMensaje.set(null);

    if (!archivo) {
      this.errorMensaje.set('Seleccione un archivo .xlsx o .csv.');
      return;
    }
    if (usuarioId === null) {
      this.errorMensaje.set('No se pudo determinar tu usuario. Volvé a iniciar sesión.');
      return;
    }

    this.cargando.set(true);
    this.egresoService
      .cargarMasivo(archivo, usuarioId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (resultado) => {
          this.resultado.set(resultado);
          this.archivoSeleccionado.set(null);
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo procesar el archivo.');
    }
  }
}
