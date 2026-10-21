import { TipoRecibo } from './enums.model';

export interface ReciboDTO {
  id?: number;
  
  correlativo?: string;
  
  tipo: TipoRecibo;
  
  fecha?: string;
  
  monto: number;
  
  cuentaId?: number;
  
  bancoId?: number;
  
  usuarioId: number;
  
  depositante?: string;
  
  categoria?: string;
  
  concepto?: string;
  
  fechaDeposito?: string;
}

export interface ProcesarPagoRequest {
  
  cuentaIds: number[];
  usuarioId: number;
}

export interface CanjeBancoRequest {
  cuentaId: number;
  bancoId: number;
  
  fechaDeposito: string;
  usuarioId: number;
}
