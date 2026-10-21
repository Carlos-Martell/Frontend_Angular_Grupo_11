import { CuentaPorCobrarDTO } from './cuenta-por-cobrar.model';
import { ReciboDTO } from './recibo.model';

export interface ResumenCuentasDTO {
  cuentas: CuentaPorCobrarDTO[];
  movimientos: ReciboDTO[];
}
