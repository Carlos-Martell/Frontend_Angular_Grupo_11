import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      @if (sinPermiso) {
        <div class="alert alert-warning py-2" role="alert">
          No tenés permiso para acceder a esa sección.
        </div>
      }

      @if (sesion(); as usuario) {
        <h2 class="h5 mb-1">Hola, {{ usuario.nombres }}</h2>
        <p class="text-muted">
          Usá el menú de la izquierda para navegar entre socios, puestos, giros,
          bancos, servicios, cuentas por cobrar, recibos, egresos, reportes
          @if (usuario.rol === 'ADMINISTRADOR') { y usuarios }.
        </p>
      }
    </div>
  `,
})
export class HomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly sesion = this.authService.sesion;
  readonly sinPermiso = this.route.snapshot.queryParamMap.get('sinPermiso') === 'true';
}
