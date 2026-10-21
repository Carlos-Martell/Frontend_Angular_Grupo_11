import { EstadoEgreso } from './enums.model';

export interface EgresoDTO {
  id?: number;
  
  numeroDocumento: string;
  
  proveedor: string;
  
  fecha: string;
  
  importe: number;
  
  documentoAsociado?: string;
  
  motivo?: string;
  
  estado?: EstadoEgreso;
  usuarioId?: number;
  comprobanteUrl?: string;
}

export interface EgresoCargaMasivaResultado {
  totalFilas: number;
  registrados: number;
  errores: string[];
}
