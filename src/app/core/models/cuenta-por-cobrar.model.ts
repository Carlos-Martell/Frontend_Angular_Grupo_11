import { EstadoCuenta } from './enums.model';

export interface CuentaPorCobrarDTO {
  id?: number;
  
  servicioId: number;
  
  socioId?: number;
  puestoId?: number;
  
  periodo: string;
  
  monto: number;
  
  estado?: EstadoCuenta;
  
  lecturaInicial?: number;
  lecturaFinal?: number;
  
  fechaGeneracion?: string;
  
  fechaPago?: string;
}

export interface GenerarCuentasPuestoRequest {
  servicioId: number;
  periodo: string;
  
  puestoIds: number[];
}

export interface GenerarCuentaConsumoRequest {
  servicioId: number;
  periodo: string;
  puestoId: number;
  lecturaInicial: number;
  lecturaFinal: number;
}

export interface GenerarCuentasSocioRequest {
  servicioId: number;
  periodo: string;
  
  monto?: number;
  
  etapas?: number[];
  
  soloUnicos?: boolean;
}

export interface TotalCuentasRequest {
  
  cuentaIds: number[];
}

export interface TotalResponse {
  total: number;
}
