import { Component, signal } from '@angular/core';
import { ListadoEgresosComponent } from './listado-egresos.component';
import { RegistroEgresoComponent } from './registro-egreso.component';
import { CargaMasivaComponent } from './carga-masiva.component';

type Pestana = 'LISTADO' | 'REGISTRO' | 'MASIVO';

@Component({
  selector: 'app-egresos',
  standalone: true,
  imports: [ListadoEgresosComponent, RegistroEgresoComponent, CargaMasivaComponent],
  templateUrl: './egresos.component.html',
})
export class EgresosComponent {
  readonly pestanaActiva = signal<Pestana>('LISTADO');

  irA(pestana: Pestana): void {
    this.pestanaActiva.set(pestana);
  }
}
