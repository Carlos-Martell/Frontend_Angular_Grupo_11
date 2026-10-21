import { Moneda } from './enums.model';

export interface BancoDTO {
  id?: number;
  
  nombre: string;
  
  numeroCuenta: string;
  
  cci?: string;
  
  moneda: Moneda;
}
