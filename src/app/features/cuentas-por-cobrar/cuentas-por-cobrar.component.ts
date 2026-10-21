import { Component, signal } from '@angular/core';
import { GenerarPuestosComponent } from './generar-puestos.component';
import { GenerarConsumoComponent } from './generar-consumo.component';
import { GenerarSociosComponent } from './generar-socios.component';
import { ConsultaCuentasComponent } from './consulta-cuentas.component';

type Pestana = 'PUESTOS' | 'CONSUMO' | 'SOCIOS' | 'CONSULTA';

@Component({
  selector: 'app-cuentas-por-cobrar',
  standalone: true,
  imports: [
    GenerarPuestosComponent,
    GenerarConsumoComponent,
    GenerarSociosComponent,
    ConsultaCuentasComponent,
  ],
  templateUrl: './cuentas-por-cobrar.component.html',
})
export class CuentasPorCobrarComponent {
  readonly pestanaActiva = signal<Pestana>('CONSULTA');

  irA(pestana: Pestana): void {
    this.pestanaActiva.set(pestana);
  }
}
