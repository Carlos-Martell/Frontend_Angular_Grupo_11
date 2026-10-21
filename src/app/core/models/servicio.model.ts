import { CargoA, Moneda, Recurrencia } from './enums.model';

export interface ServicioDTO {
  id?: number;
  
  nombre: string;
  
  recurrencia: Recurrencia;
  
  costo: number;
  
  moneda: Moneda;
  
  cargoA: CargoA;
  
  esConsumo: boolean;
  
  costoUnitario?: number;
}
