import { RolUsuario } from './auth.model';

export interface UsuarioDTO {
  id?: number;
  
  username: string;
  
  password?: string;
  
  nombres: string;
  
  apellidos: string;
  
  email?: string;
  
  rol: RolUsuario;
  activo?: boolean;
}
