import { Component, signal } from '@angular/core';
import { ProcesarPagoComponent } from './procesar-pago.component';
import { CanjeBancoComponent } from './canje-banco.component';
import { IngresoExternoComponent } from './ingreso-externo.component';
import { ListadoRecibosComponent } from './listado-recibos.component';

type Pestana = 'PAGO' | 'CANJE' | 'INGRESO' | 'LISTADO';

@Component({
  selector: 'app-recibos',
  standalone: true,
  imports: [ProcesarPagoComponent, CanjeBancoComponent, IngresoExternoComponent, ListadoRecibosComponent],
  templateUrl: './recibos.component.html',
})
export class RecibosComponent {
  readonly pestanaActiva = signal<Pestana>('LISTADO');

  irA(pestana: Pestana): void {
    this.pestanaActiva.set(pestana);
  }
}
